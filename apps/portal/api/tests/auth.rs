//! Exercises the sign-in flows (magic links, sessions, OIDC request state)
//! against a real Postgres (a service container in CI, or a local container
//! during development). Requires `DATABASE_URL`. These call the library's
//! auth/repo modules directly, so they cover both the SQL and the Rust logic.
//!
//! The recurring assertions are the project invariants: sign-in never creates
//! members, never mutates member status, and never reveals whether an address
//! is registered.

use portal_api::auth::{magic, oidc, session};
use portal_api::members::model::NewMember;
use portal_api::members::repo::{self, SubmitOutcome};
use portal_api::members::validate::validate_new_member;
use sha2::{Digest, Sha256};
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
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

/// SHA-256 the same way the library does, for planting token fixtures.
fn sha256(token: &str) -> [u8; 32] {
    let mut h = Sha256::new();
    h.update(token.as_bytes());
    h.finalize().into()
}

/// Run a member through the full join → verify flow so it is `active` — the
/// only kind of member sign-in is allowed to work for.
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

async fn member_status(pool: &PgPool, member_id: Uuid) -> String {
    sqlx::query_scalar("SELECT status FROM members WHERE id = $1")
        .bind(member_id)
        .fetch_one(pool)
        .await
        .expect("member status")
}

#[tokio::test]
async fn magic_link_signin_happy_path() {
    let pool = pool().await;
    let (member_id, email) = active_member(&pool, "signin").await;

    let (token_member_id, raw_token) = magic::request_login_token(&pool, &email, 15)
        .await
        .expect("request login token")
        .expect("active member gets a token");
    assert_eq!(token_member_id, member_id);

    let consumed = magic::consume_login_token(&pool, &raw_token)
        .await
        .expect("consume login token")
        .expect("fresh token signs in");
    assert_eq!(consumed, member_id);

    let raw_session = session::mint_session(&pool, member_id, 30)
        .await
        .expect("mint session");
    let sm = session::validate_session(&pool, &raw_session)
        .await
        .expect("validate session")
        .expect("fresh session is valid");
    assert_eq!(sm.member_id, member_id);
    assert_eq!(sm.first_name, "Test");
    assert_eq!(sm.last_name, "Member");
    assert_eq!(sm.institutional_email, email);
    assert_eq!(sm.status, "active");
}

#[tokio::test]
async fn magic_link_never_enumerates_or_creates_members() {
    let pool = pool().await;

    // Unknown address: no token, and — the invariant — no member row appears.
    let unknown = unique_email("unknown");
    assert!(magic::request_login_token(&pool, &unknown, 15)
        .await
        .expect("request for unknown email")
        .is_none());
    let created: i64 =
        sqlx::query_scalar("SELECT count(*) FROM members WHERE institutional_email = $1")
            .bind(&unknown)
            .fetch_one(&pool)
            .await
            .expect("count");
    assert_eq!(created, 0, "sign-in must never create a member");

    // Pending (unverified) member: exists, but must not be able to sign in.
    let email = unique_email("pending");
    let member = validate_new_member(sample(&email)).expect("valid submission");
    match repo::submit_member(&pool, &member).await.expect("submit") {
        SubmitOutcome::NeedsVerification { .. } => {}
        SubmitOutcome::AlreadyActive => panic!("a new member must need verification"),
    }
    assert!(magic::request_login_token(&pool, &email, 15)
        .await
        .expect("request for pending member")
        .is_none());
}

#[tokio::test]
async fn login_tokens_are_single_use_and_expire() {
    let pool = pool().await;
    let (member_id, email) = active_member(&pool, "singleuse").await;

    // Single-use: the second consume of the same token must fail.
    let (_, raw_token) = magic::request_login_token(&pool, &email, 15)
        .await
        .expect("request")
        .expect("token issued");
    assert!(magic::consume_login_token(&pool, &raw_token)
        .await
        .expect("first consume")
        .is_some());
    assert!(magic::consume_login_token(&pool, &raw_token)
        .await
        .expect("second consume")
        .is_none());

    // Expiry: plant an already-expired token directly, then consume must fail.
    let expired = "expired-login-token-fixture";
    let hash = sha256(expired);
    sqlx::query(
        "INSERT INTO login_tokens (member_id, token_hash, expires_at)
         VALUES ($1, $2, now() - interval '1 hour')",
    )
    .bind(member_id)
    .bind(&hash[..])
    .execute(&pool)
    .await
    .expect("insert expired token");
    assert!(magic::consume_login_token(&pool, expired)
        .await
        .expect("consume expired")
        .is_none());

    // None of the above may have touched the member row.
    assert_eq!(member_status(&pool, member_id).await, "active");
}

#[tokio::test]
async fn sessions_reject_garbage_revoked_expired_and_inactive_members() {
    let pool = pool().await;

    // Garbage token: unknown hash, no session.
    assert!(session::validate_session(&pool, "not-a-real-session")
        .await
        .expect("validate garbage")
        .is_none());

    let (member_id, _email) = active_member(&pool, "sessions").await;

    // Revocation takes effect immediately, and revoking twice is fine.
    let raw = session::mint_session(&pool, member_id, 30)
        .await
        .expect("mint");
    assert!(session::validate_session(&pool, &raw)
        .await
        .expect("validate fresh")
        .is_some());
    session::revoke_session(&pool, &raw).await.expect("revoke");
    assert!(session::validate_session(&pool, &raw)
        .await
        .expect("validate revoked")
        .is_none());
    session::revoke_session(&pool, &raw)
        .await
        .expect("revoke is idempotent");

    // Expiry: plant an already-expired session directly.
    let expired = "expired-session-fixture";
    let hash = sha256(expired);
    sqlx::query(
        "INSERT INTO sessions (member_id, token_hash, expires_at)
         VALUES ($1, $2, now() - interval '1 hour')",
    )
    .bind(member_id)
    .bind(&hash[..])
    .execute(&pool)
    .await
    .expect("insert expired session");
    assert!(session::validate_session(&pool, expired)
        .await
        .expect("validate expired")
        .is_none());

    // A live session dies the moment its member stops being active.
    let raw = session::mint_session(&pool, member_id, 30)
        .await
        .expect("mint second");
    assert!(session::validate_session(&pool, &raw)
        .await
        .expect("validate before status change")
        .is_some());
    sqlx::query("UPDATE members SET status = 'alumni', updated_at = now() WHERE id = $1")
        .bind(member_id)
        .execute(&pool)
        .await
        .expect("move member to alumni");
    assert!(session::validate_session(&pool, &raw)
        .await
        .expect("validate after status change")
        .is_none());
}

#[tokio::test]
async fn oidc_auth_requests_are_single_use_and_expire() {
    let pool = pool().await;

    // Same storage code path `begin_auth` uses, minus the network round-trip.
    let state = format!("state-{}", Uuid::new_v4().simple());
    let nonce = format!("nonce-{}", Uuid::new_v4().simple());
    let verifier = format!("verifier-{}", Uuid::new_v4().simple());
    oidc::store_auth_request(&pool, &state, &nonce, &verifier)
        .await
        .expect("store auth request");

    let (nonce_hash, stored_verifier) = oidc::consume_auth_request(&pool, &state)
        .await
        .expect("consume")
        .expect("fresh state consumes");
    assert_eq!(nonce_hash, sha256(&nonce).to_vec());
    assert_eq!(stored_verifier, verifier);

    // Single-use: replaying the same callback state must fail.
    assert!(oidc::consume_auth_request(&pool, &state)
        .await
        .expect("second consume")
        .is_none());

    // Expiry: plant an already-expired request directly.
    let expired_state = format!("expired-state-{}", Uuid::new_v4().simple());
    let state_hash = sha256(&expired_state);
    let nonce_hash = sha256("whatever-nonce");
    sqlx::query(
        "INSERT INTO oidc_auth_requests (state_hash, nonce_hash, pkce_verifier, expires_at)
         VALUES ($1, $2, 'v', now() - interval '1 hour')",
    )
    .bind(&state_hash[..])
    .bind(&nonce_hash[..])
    .execute(&pool)
    .await
    .expect("insert expired auth request");
    assert!(oidc::consume_auth_request(&pool, &expired_state)
        .await
        .expect("consume expired")
        .is_none());
}
