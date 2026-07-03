//! Exercises the per-IP rate limiter and the per-address email cooldown
//! through the real router (`build_router`), against a real Postgres (a
//! service container in CI, or a local container during development).
//! Requires `DATABASE_URL`.
//!
//! Requests are fired with `tower::ServiceExt::oneshot` and a spoofed
//! `X-Forwarded-For`, matching how the Azure Container Apps ingress presents
//! the client IP. The pure key-extraction and window logic is unit-tested in
//! `src/rate_limit.rs`; these tests cover the wiring: which routes are
//! guarded, the shape of the `429`, and the cooldown's enumeration safety.

use std::sync::Arc;

use arc_swap::ArcSwap;
use axum::body::Body;
use axum::http::{header, Request, StatusCode};
use axum::response::Response;
use axum::Router;
use portal_api::auth::session::CookieConfig;
use portal_api::email::LogEmailSender;
use portal_api::members::model::NewMember;
use portal_api::members::repo::{self, SubmitOutcome};
use portal_api::members::validate::validate_new_member;
use portal_api::router::build_router;
use portal_api::state::AppState;
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use tower::ServiceExt;
use uuid::Uuid;

async fn pool() -> PgPool {
    let url =
        std::env::var("DATABASE_URL").expect("DATABASE_URL must be set to run integration tests");
    let pool = PgPoolOptions::new()
        .max_connections(2)
        .connect(&url)
        .await
        .expect("connect to postgres");
    sqlx::migrate!()
        .run(&pool)
        .await
        .expect("migrations apply cleanly");
    pool
}

/// A router over the real state, with a configurable limit and cooldown.
fn app(pool: PgPool, rate_limit_per_minute: u32, email_cooldown_seconds: i64) -> Router {
    build_router(AppState {
        db: Arc::new(ArcSwap::from_pointee(pool)),
        email: Arc::new(LogEmailSender),
        public_base_url: "http://localhost:3000".to_string(),
        verification_ttl_hours: 24,
        cors_allowed_origins: vec!["http://localhost:3000".to_string()],
        session_ttl_days: 30,
        login_link_ttl_minutes: 15,
        cookie: CookieConfig {
            domain: None,
            secure: false,
        },
        rate_limit_per_minute,
        email_cooldown_seconds,
        oidc: None,
    })
}

/// A unique institutional address per test run, so tests don't collide on the
/// `institutional_email` unique constraint.
fn unique_email(prefix: &str) -> String {
    format!("{prefix}_{}@students.pupr.edu", Uuid::new_v4().simple())
}

fn sample(institutional_email: &str) -> NewMember {
    NewMember {
        first_name: "Test".into(),
        last_name: "Member".into(),
        personal_email: "test.member@gmail.com".into(),
        institutional_email: institutional_email.into(),
        concentration: "Computer Engineering".into(),
        department: "electrica".into(),
    }
}

/// Run a member through join → verify so it is `active` (magic links are only
/// issued to active members).
async fn active_member(pool: &PgPool, prefix: &str) -> String {
    let email = unique_email(prefix);
    let member = validate_new_member(sample(&email)).expect("valid submission");
    let member_id = match repo::submit_member(pool, &member).await.expect("submit") {
        SubmitOutcome::NeedsVerification { member_id } => member_id,
        SubmitOutcome::AlreadyActive => panic!("a new member must need verification"),
    };
    let token = repo::issue_token(pool, member_id, 24)
        .await
        .expect("issue token");
    assert!(repo::confirm_token(pool, &token).await.expect("confirm"));
    email
}

/// POST a JSON body to a route, optionally spoofing the forwarded client IP.
async fn post_json(
    app: &Router,
    uri: &str,
    xff: Option<&str>,
    body: serde_json::Value,
) -> Response {
    let mut req = Request::builder()
        .method("POST")
        .uri(uri)
        .header(header::CONTENT_TYPE, "application/json");
    if let Some(ip) = xff {
        req = req.header("x-forwarded-for", ip);
    }
    let req = req
        .body(Body::from(serde_json::to_vec(&body).expect("serialize")))
        .expect("build request");
    app.clone().oneshot(req).await.expect("infallible")
}

fn magic_link_body(email: &str) -> serde_json::Value {
    serde_json::json!({ "institutionalEmail": email })
}

async fn body_bytes(resp: Response) -> Vec<u8> {
    axum::body::to_bytes(resp.into_body(), 64 * 1024)
        .await
        .expect("read body")
        .to_vec()
}

#[tokio::test]
async fn per_ip_limit_returns_429_after_allowance() {
    let app = app(pool().await, 3, 0);
    let attacker_ip = "203.0.113.7";

    // The allowance passes with the endpoint's normal status (202 — the
    // address is unknown, but that must not show).
    for i in 0..3 {
        let resp = post_json(
            &app,
            "/api/v1/auth/magic-link",
            Some(attacker_ip),
            magic_link_body(&unique_email("rl")),
        )
        .await;
        assert_eq!(
            resp.status(),
            StatusCode::ACCEPTED,
            "request {i} within allowance"
        );
    }

    // Request N+1 from the same IP is limited, with Retry-After and the
    // generic error envelope.
    let resp = post_json(
        &app,
        "/api/v1/auth/magic-link",
        Some(attacker_ip),
        magic_link_body(&unique_email("rl")),
    )
    .await;
    assert_eq!(resp.status(), StatusCode::TOO_MANY_REQUESTS);
    let retry_after: u64 = resp
        .headers()
        .get(header::RETRY_AFTER)
        .expect("Retry-After present")
        .to_str()
        .expect("ascii")
        .parse()
        .expect("seconds");
    assert!((1..=60).contains(&retry_after));
    let body: serde_json::Value =
        serde_json::from_slice(&body_bytes(resp).await).expect("json body");
    assert_eq!(body["error"]["code"], "rate_limited");

    // A different client IP is not affected.
    let resp = post_json(
        &app,
        "/api/v1/auth/magic-link",
        Some("203.0.113.8"),
        magic_link_body(&unique_email("rl")),
    )
    .await;
    assert_eq!(resp.status(), StatusCode::ACCEPTED);
}

#[tokio::test]
async fn limited_response_is_identical_for_known_and_unknown_addresses() {
    let pool = pool().await;
    let known = active_member(&pool, "rl_known").await;
    let app = app(pool, 1, 0);
    let ip = "203.0.113.9";

    // Burn the allowance.
    let resp = post_json(
        &app,
        "/api/v1/auth/magic-link",
        Some(ip),
        magic_link_body(&unique_email("rl_burn")),
    )
    .await;
    assert_eq!(resp.status(), StatusCode::ACCEPTED);

    // Over the limit, a registered address and an unknown one must be
    // byte-for-byte indistinguishable — no enumeration through the 429.
    let for_known = post_json(
        &app,
        "/api/v1/auth/magic-link",
        Some(ip),
        magic_link_body(&known),
    )
    .await;
    let for_unknown = post_json(
        &app,
        "/api/v1/auth/magic-link",
        Some(ip),
        magic_link_body(&unique_email("rl_unknown")),
    )
    .await;
    assert_eq!(for_known.status(), StatusCode::TOO_MANY_REQUESTS);
    assert_eq!(for_unknown.status(), StatusCode::TOO_MANY_REQUESTS);
    assert_eq!(body_bytes(for_known).await, body_bytes(for_unknown).await);
}

#[tokio::test]
async fn join_and_resend_share_the_limiter_but_health_does_not() {
    let app = app(pool().await, 2, 0);
    let ip = "203.0.113.10";

    // Join + resend draw from the same per-IP bucket…
    let email = unique_email("rl_group");
    let resp = post_json(
        &app,
        "/api/v1/members",
        Some(ip),
        serde_json::json!({
            "firstName": "Test",
            "lastName": "Member",
            "personalEmail": "test.member@gmail.com",
            "institutionalEmail": email,
            "concentration": "Computer Engineering",
            "department": "electrica",
        }),
    )
    .await;
    assert_eq!(resp.status(), StatusCode::ACCEPTED);
    let resp = post_json(
        &app,
        "/api/v1/members/resend",
        Some(ip),
        magic_link_body(&unique_email("rl_group")),
    )
    .await;
    assert_eq!(resp.status(), StatusCode::ACCEPTED);
    let resp = post_json(
        &app,
        "/api/v1/members/resend",
        Some(ip),
        magic_link_body(&unique_email("rl_group")),
    )
    .await;
    assert_eq!(resp.status(), StatusCode::TOO_MANY_REQUESTS);

    // …while unguarded routes stay reachable from the same exhausted IP.
    for _ in 0..5 {
        let req = Request::builder()
            .method("GET")
            .uri("/health")
            .header("x-forwarded-for", ip)
            .body(Body::empty())
            .expect("build request");
        let resp = app.clone().oneshot(req).await.expect("infallible");
        assert_ne!(resp.status(), StatusCode::TOO_MANY_REQUESTS);
    }
}

#[tokio::test]
async fn magic_link_cooldown_sends_once_but_still_answers_202() {
    let pool = pool().await;
    let email = active_member(&pool, "cooldown_magic").await;
    let app = app(pool.clone(), 100, 300);

    // Two immediate requests: both get the same enumeration-safe 202…
    for _ in 0..2 {
        let resp = post_json(
            &app,
            "/api/v1/auth/magic-link",
            Some("203.0.113.20"),
            magic_link_body(&email),
        )
        .await;
        assert_eq!(resp.status(), StatusCode::ACCEPTED);
        let body: serde_json::Value =
            serde_json::from_slice(&body_bytes(resp).await).expect("json body");
        assert_eq!(body["status"], "link_sent");
    }

    // …but only the first minted a token (i.e. only one email went out).
    let tokens: i64 = sqlx::query_scalar(
        "SELECT count(*) FROM login_tokens lt
          JOIN members m ON m.id = lt.member_id
         WHERE m.institutional_email = $1",
    )
    .bind(&email)
    .fetch_one(&pool)
    .await
    .expect("count login tokens");
    assert_eq!(tokens, 1, "cooldown must suppress the second send");
}

#[tokio::test]
async fn verification_cooldown_covers_join_and_resend() {
    let pool = pool().await;
    let email = unique_email("cooldown_join");
    let app = app(pool.clone(), 100, 300);

    let join = serde_json::json!({
        "firstName": "Test",
        "lastName": "Member",
        "personalEmail": "test.member@gmail.com",
        "institutionalEmail": email,
        "concentration": "Computer Engineering",
        "department": "electrica",
    });

    // Join sends the first verification email; an immediate resend (and an
    // immediate re-join) are suppressed by the cooldown yet still answer 202.
    let resp = post_json(&app, "/api/v1/members", Some("203.0.113.21"), join.clone()).await;
    assert_eq!(resp.status(), StatusCode::ACCEPTED);
    let resp = post_json(
        &app,
        "/api/v1/members/resend",
        Some("203.0.113.22"),
        magic_link_body(&email),
    )
    .await;
    assert_eq!(resp.status(), StatusCode::ACCEPTED);
    let resp = post_json(&app, "/api/v1/members", Some("203.0.113.23"), join).await;
    assert_eq!(resp.status(), StatusCode::ACCEPTED);

    let tokens: i64 = sqlx::query_scalar(
        "SELECT count(*) FROM member_verifications mv
          JOIN members m ON m.id = mv.member_id
         WHERE m.institutional_email = $1",
    )
    .bind(&email)
    .fetch_one(&pool)
    .await
    .expect("count verification tokens");
    assert_eq!(
        tokens, 1,
        "cooldown must suppress repeat verification sends"
    );
}

#[tokio::test]
async fn cooldown_zero_disables_suppression() {
    let pool = pool().await;
    let email = active_member(&pool, "cooldown_off").await;
    let app = app(pool.clone(), 100, 0);

    for _ in 0..2 {
        let resp = post_json(
            &app,
            "/api/v1/auth/magic-link",
            Some("203.0.113.24"),
            magic_link_body(&email),
        )
        .await;
        assert_eq!(resp.status(), StatusCode::ACCEPTED);
    }

    let tokens: i64 = sqlx::query_scalar(
        "SELECT count(*) FROM login_tokens lt
          JOIN members m ON m.id = lt.member_id
         WHERE m.institutional_email = $1",
    )
    .bind(&email)
    .fetch_one(&pool)
    .await
    .expect("count login tokens");
    assert_eq!(tokens, 2, "cooldown 0 must not suppress sends");
}
