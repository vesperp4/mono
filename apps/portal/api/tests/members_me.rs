//! Exercises the authenticated member endpoints (`GET`/`PATCH`
//! `/api/v1/members/me`, issue #172) against a real Postgres (a service
//! container in CI, or a local container during development). Requires
//! `DATABASE_URL`.
//!
//! Unlike the other integration suites these drive the actual router with
//! in-process HTTP requests (`tower::ServiceExt::oneshot`), because the thing
//! under test is the HTTP surface itself: the `CurrentMember` extractor's
//! cookie handling and 401s, the JSON shapes, and the `deny_unknown_fields`
//! rejection of non-editable fields.

use std::sync::Arc;

use axum::body::Body;
use axum::http::{header, Request, StatusCode};
use axum::Router;
use http_body_util::BodyExt;
use portal_api::auth::session::{self, CookieConfig};
use portal_api::db;
use portal_api::email::LogEmailSender;
use portal_api::members::model::NewMember;
use portal_api::members::repo::{self, SubmitOutcome};
use portal_api::members::validate::validate_new_member;
use portal_api::router::build_router;
use portal_api::state::AppState;
use serde_json::{json, Value};
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use tower::ServiceExt;
use uuid::Uuid;

const ME: &str = "/api/v1/members/me";

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

/// The real router over the test pool — requests hit exactly the stack that
/// serves production traffic (routes, extractors, layers).
fn app(pool: PgPool) -> Router {
    build_router(AppState {
        db: db::share(pool),
        email: Arc::new(LogEmailSender),
        public_base_url: "http://localhost:3000".into(),
        verification_ttl_hours: 24,
        cors_allowed_origins: vec!["http://localhost:3000".into()],
        session_ttl_days: 30,
        login_link_ttl_minutes: 15,
        // Generous limit / no cooldown so the email-endpoint limiter can
        // never interfere with what these tests exercise.
        rate_limit_per_minute: 1000,
        email_cooldown_seconds: 0,
        cookie: CookieConfig {
            domain: None,
            secure: false,
        },
        oidc: None,
    })
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

/// A unique institutional address per test run, so tests don't collide on the
/// `institutional_email` unique constraint.
fn unique_email(prefix: &str) -> String {
    format!("{prefix}_{}@students.pupr.edu", Uuid::new_v4().simple())
}

/// Run a member through the full join → verify flow so it is `active`.
async fn active_member(pool: &PgPool, prefix: &str) -> (Uuid, String) {
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
    (member_id, email)
}

/// An active member with a freshly minted session (the raw cookie value).
async fn signed_in_member(pool: &PgPool, prefix: &str) -> (Uuid, String, String) {
    let (member_id, email) = active_member(pool, prefix).await;
    let raw_session = session::mint_session(pool, member_id, 30)
        .await
        .expect("mint session");
    (member_id, email, raw_session)
}

fn get_me(session_cookie: Option<&str>) -> Request<Body> {
    let mut req = Request::builder().method("GET").uri(ME);
    if let Some(raw) = session_cookie {
        req = req.header(header::COOKIE, format!("{}={raw}", session::SESSION_COOKIE));
    }
    req.body(Body::empty()).expect("build GET request")
}

fn patch_me(session_cookie: Option<&str>, body: &Value) -> Request<Body> {
    let mut req = Request::builder()
        .method("PATCH")
        .uri(ME)
        .header(header::CONTENT_TYPE, "application/json");
    if let Some(raw) = session_cookie {
        req = req.header(header::COOKIE, format!("{}={raw}", session::SESSION_COOKIE));
    }
    req.body(Body::from(body.to_string()))
        .expect("build PATCH request")
}

/// Send one request through the router and return (status, raw body bytes).
async fn send(app: &Router, req: Request<Body>) -> (StatusCode, Vec<u8>) {
    let response = app.clone().oneshot(req).await.expect("router response");
    let status = response.status();
    let body = response
        .into_body()
        .collect()
        .await
        .expect("read body")
        .to_bytes()
        .to_vec();
    (status, body)
}

/// Like [`send`], but the body must parse as JSON.
async fn send_json(app: &Router, req: Request<Body>) -> (StatusCode, Value) {
    let (status, body) = send(app, req).await;
    let value = serde_json::from_slice(&body)
        .unwrap_or_else(|_| panic!("non-JSON body: {}", String::from_utf8_lossy(&body)));
    (status, value)
}

fn assert_unauthorized(status: StatusCode, body: &Value) {
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert_eq!(body["error"]["code"], "unauthorized");
}

#[tokio::test]
async fn get_me_returns_the_profile() {
    let pool = pool().await;
    let app = app(pool.clone());
    let (member_id, email, raw_session) = signed_in_member(&pool, "me_get").await;

    let (status, raw) = send(&app, get_me(Some(&raw_session))).await;
    assert_eq!(status, StatusCode::OK);

    // The raw session token must never appear anywhere in the response.
    let text = String::from_utf8_lossy(&raw);
    assert!(
        !text.contains(&raw_session),
        "profile response must not leak session material"
    );

    let body: Value = serde_json::from_slice(&raw).expect("profile JSON");
    assert_eq!(body["id"], member_id.to_string());
    assert_eq!(body["firstName"], "Test");
    assert_eq!(body["lastName"], "Member");
    assert_eq!(body["personalEmail"], "test.member@gmail.com");
    assert_eq!(body["institutionalEmail"], email);
    assert_eq!(body["concentration"], "Computer Engineering");
    assert_eq!(body["department"], "electrica");
    assert_eq!(body["status"], "active");
    assert_eq!(body["newsletterOptIn"], true);
    assert!(
        body["verifiedAt"].is_string(),
        "an active member has joined"
    );
    assert!(body["createdAt"].is_string());
}

#[tokio::test]
async fn me_rejects_missing_invalid_revoked_and_deactivated_sessions() {
    let pool = pool().await;
    let app = app(pool.clone());

    // No cookie at all.
    let (status, body) = send_json(&app, get_me(None)).await;
    assert_unauthorized(status, &body);

    // A cookie holding a token that was never a session.
    let (status, body) = send_json(&app, get_me(Some("not-a-real-session"))).await;
    assert_unauthorized(status, &body);

    // A revoked session (signed out).
    let (_, _, raw_session) = signed_in_member(&pool, "me_revoked").await;
    session::revoke_session(&pool, &raw_session)
        .await
        .expect("revoke");
    let (status, body) = send_json(&app, get_me(Some(&raw_session))).await;
    assert_unauthorized(status, &body);

    // A live session whose member is no longer active.
    let (member_id, _, raw_session) = signed_in_member(&pool, "me_alumni").await;
    sqlx::query("UPDATE members SET status = 'alumni', updated_at = now() WHERE id = $1")
        .bind(member_id)
        .execute(&pool)
        .await
        .expect("move member to alumni");
    let (status, body) = send_json(&app, get_me(Some(&raw_session))).await;
    assert_unauthorized(status, &body);

    // PATCH sits behind the same extractor.
    let (status, body) = send_json(&app, patch_me(None, &json!({"concentration": "X"}))).await;
    assert_unauthorized(status, &body);
}

#[tokio::test]
async fn patch_me_updates_the_mutable_fields() {
    let pool = pool().await;
    let app = app(pool.clone());
    let (_, email, raw_session) = signed_in_member(&pool, "me_patch").await;

    // Full update of every self-editable field. The personal email arrives
    // un-normalized to prove the join-form normalization applies here too.
    let (status, body) = send_json(
        &app,
        patch_me(
            Some(&raw_session),
            &json!({
                "personalEmail": "  New.Contact@Outlook.com ",
                "concentration": "Software Engineering",
                "department": "industrial",
                "newsletterOptIn": false,
            }),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["personalEmail"], "new.contact@outlook.com");
    assert_eq!(body["concentration"], "Software Engineering");
    assert_eq!(body["department"], "industrial");
    assert_eq!(body["newsletterOptIn"], false);
    // The immutable identity fields ride along unchanged.
    assert_eq!(body["institutionalEmail"], email);
    assert_eq!(body["status"], "active");

    // Partial update: one field changes, the rest keep their new values.
    // A JSON null is indistinguishable from an omitted field — "no change".
    let (status, body) = send_json(
        &app,
        patch_me(
            Some(&raw_session),
            &json!({ "newsletterOptIn": true, "personalEmail": null }),
        ),
    )
    .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["newsletterOptIn"], true);
    assert_eq!(body["personalEmail"], "new.contact@outlook.com");
    assert_eq!(body["concentration"], "Software Engineering");
    assert_eq!(body["department"], "industrial");

    // GET reflects the persisted state, same shape.
    let (status, body) = send_json(&app, get_me(Some(&raw_session))).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["personalEmail"], "new.contact@outlook.com");
    assert_eq!(body["department"], "industrial");
}

#[tokio::test]
async fn patch_me_rejects_non_editable_and_unknown_fields() {
    let pool = pool().await;
    let app = app(pool.clone());
    let (member_id, email, raw_session) = signed_in_member(&pool, "me_immutable").await;

    // `deny_unknown_fields` turns any attempt to smuggle in a non-editable
    // (or simply unknown) field into a 422 — never a silent ignore.
    for payload in [
        json!({ "institutionalEmail": "attacker@students.pupr.edu" }),
        json!({ "status": "alumni" }),
        json!({ "concentration": "Legit", "status": "alumni" }),
        json!({ "firstName": "NewName" }),
    ] {
        let (status, _) = send(&app, patch_me(Some(&raw_session), &payload)).await;
        assert_eq!(
            status,
            StatusCode::UNPROCESSABLE_ENTITY,
            "payload {payload} must be rejected"
        );
    }

    // Nothing was written — not even the payloads that mixed in a valid field.
    let (db_email, db_status, db_concentration): (String, String, String) = sqlx::query_as(
        "SELECT institutional_email, status, concentration FROM members WHERE id = $1",
    )
    .bind(member_id)
    .fetch_one(&pool)
    .await
    .expect("member row");
    assert_eq!(db_email, email);
    assert_eq!(db_status, "active");
    assert_eq!(db_concentration, "Computer Engineering");
}

#[tokio::test]
async fn patch_me_validates_field_values() {
    let pool = pool().await;
    let app = app(pool.clone());
    let (_, _, raw_session) = signed_in_member(&pool, "me_validate").await;

    for payload in [
        json!({ "department": "underwater-basket-weaving" }),
        json!({ "personalEmail": "not-an-email" }),
        json!({ "concentration": "   " }),
    ] {
        let (status, body) = send_json(&app, patch_me(Some(&raw_session), &payload)).await;
        assert_eq!(
            status,
            StatusCode::BAD_REQUEST,
            "payload {payload} must fail validation"
        );
        assert_eq!(body["error"]["code"], "validation_error");
    }

    // And the member is untouched by the failed attempts.
    let (status, body) = send_json(&app, get_me(Some(&raw_session))).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["department"], "electrica");
    assert_eq!(body["personalEmail"], "test.member@gmail.com");
    assert_eq!(body["concentration"], "Computer Engineering");
}
