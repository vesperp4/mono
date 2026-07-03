use std::time::Duration;

use axum::extract::State;
use axum::http::{header, HeaderValue, Method, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde_json::json;
use sqlx::PgPool;
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::timeout::TimeoutLayer;

use crate::auth;
use crate::members;
use crate::rate_limit::{self, RateLimiter};
use crate::state::AppState;

/// Largest request body we accept. The members payloads are tiny JSON objects;
/// this caps abuse without affecting legitimate calls.
const MAX_BODY_BYTES: usize = 16 * 1024;

/// Whole-request timeout. Generous for a DB write + email enqueue, but bounds
/// how long a slow/stuck request can tie up a worker.
const REQUEST_TIMEOUT: Duration = Duration::from_secs(15);

/// Build the application router: health check + the members API, hardened with a
/// CORS allowlist, a request-body size cap, and a per-request timeout.
pub fn build_router(state: AppState) -> Router {
    // The web app is served from a different origin (Static Web App) than this
    // API, so browsers require CORS for the signup/confirm pages to call it.
    // Only the configured origins are allowed — never `*`.
    let origins: Vec<HeaderValue> = state
        .cors_allowed_origins
        .iter()
        .filter_map(|o| match o.parse::<HeaderValue>() {
            Ok(v) => Some(v),
            Err(_) => {
                tracing::warn!(origin = %o, "ignoring invalid CORS origin");
                None
            }
        })
        .collect();

    let cors = CorsLayer::new()
        .allow_origin(AllowOrigin::list(origins))
        .allow_methods([Method::GET, Method::POST, Method::PATCH])
        .allow_headers([header::CONTENT_TYPE])
        // The session cookie must ride along on the portal's fetch() calls
        // (`credentials: "include"`), which browsers only honor when this
        // header is present. Legal to combine with the origin list above
        // because it is an explicit allowlist — never `*`.
        .allow_credentials(true);

    // Per-client-IP limiter shared by the three public endpoints that send
    // email (join, resend, magic-link) — the abuse vectors (ACS quota burn,
    // email-bombing an address). One bucket per IP across the group; other
    // routes are untouched. In-memory, so per replica — see `rate_limit` docs.
    let email_rate_limit = axum::middleware::from_fn_with_state(
        RateLimiter::new(state.rate_limit_per_minute),
        rate_limit::enforce,
    );

    Router::new()
        // Liveness: process-only, never touches the DB. A liveness probe that
        // depended on Postgres would let a transient DB blip fail the probe and
        // have the orchestrator kill (and restart-storm) otherwise-healthy
        // replicas — each restart re-running migrations against the recovering
        // DB. Readiness (`/health`) is the DB-aware check that gates traffic.
        .route("/livez", get(livez))
        .route("/health", get(health))
        .route(
            "/api/v1/members",
            post(members::handlers::create_member).layer(email_rate_limit.clone()),
        )
        .route(
            "/api/v1/members/me",
            get(members::handlers::get_me).patch(members::handlers::update_me),
        )
        .route(
            "/api/v1/members/confirm",
            post(members::handlers::confirm_member),
        )
        .route(
            "/api/v1/members/resend",
            post(members::handlers::resend_verification).layer(email_rate_limit.clone()),
        )
        .route("/api/v1/auth/oidc/start", get(auth::handlers::oidc_start))
        .route(
            "/api/v1/auth/oidc/callback",
            get(auth::handlers::oidc_callback),
        )
        .route(
            "/api/v1/auth/magic-link",
            post(auth::handlers::request_magic_link).layer(email_rate_limit),
        )
        .route(
            "/api/v1/auth/magic-link/consume",
            post(auth::handlers::consume_magic_link),
        )
        .route("/api/v1/auth/signout", post(auth::handlers::signout))
        // Layers are applied outermost-last: CORS wraps everything so even
        // rejected/timed-out responses carry the right headers.
        .layer(TimeoutLayer::with_status_code(
            StatusCode::REQUEST_TIMEOUT,
            REQUEST_TIMEOUT,
        ))
        .layer(RequestBodyLimitLayer::new(MAX_BODY_BYTES))
        .layer(cors)
        .with_state(state)
}

/// Liveness: the process is up and serving. Deliberately does no I/O so a
/// dependency outage never causes the orchestrator to restart a healthy pod.
async fn livez() -> impl IntoResponse {
    (StatusCode::OK, Json(json!({"status": "ok"})))
}

async fn health(State(state): State<AppState>) -> impl IntoResponse {
    match probe_db(&state.db.load()).await {
        Ok(_) => (
            StatusCode::OK,
            Json(json!({"status": "ok", "database": "up"})),
        ),
        Err(err) => {
            tracing::error!(error = %err, "database health check failed");
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"status": "degraded", "database": "down"})),
            )
        }
    }
}

async fn probe_db(db: &PgPool) -> Result<(), sqlx::Error> {
    sqlx::query_scalar::<_, i32>("SELECT 1")
        .fetch_one(db)
        .await?;
    Ok(())
}
