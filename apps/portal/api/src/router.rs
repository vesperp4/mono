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

use crate::members;
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
        .allow_methods([Method::GET, Method::POST])
        .allow_headers([header::CONTENT_TYPE]);

    Router::new()
        .route("/health", get(health))
        .route("/api/v1/members", post(members::handlers::create_member))
        .route(
            "/api/v1/members/confirm",
            post(members::handlers::confirm_member),
        )
        .route(
            "/api/v1/members/resend",
            post(members::handlers::resend_verification),
        )
        // Layers are applied outermost-last: CORS wraps everything so even
        // rejected/timed-out responses carry the right headers.
        // TODO(dev-team): add per-IP rate limiting on /members + /resend (an
        // email-abuse vector) — e.g. tower_governor — once a real mail provider
        // is wired and we can pick sensible limits.
        .layer(TimeoutLayer::with_status_code(
            StatusCode::REQUEST_TIMEOUT,
            REQUEST_TIMEOUT,
        ))
        .layer(RequestBodyLimitLayer::new(MAX_BODY_BYTES))
        .layer(cors)
        .with_state(state)
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
