//! Exercises the members join → verify flow against a real Postgres (a service
//! container in CI, or a local container during development). Requires
//! `DATABASE_URL`. These call the library's repo/validation directly, so they
//! cover both the SQL and the Rust logic.

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

#[tokio::test]
async fn join_then_confirm_activates_member() {
    let pool = pool().await;
    let member = validate_new_member(sample(&unique_email("join"))).expect("valid submission");

    let member_id = match repo::submit_member(&pool, &member).await.expect("submit") {
        SubmitOutcome::NeedsVerification { member_id } => member_id,
        SubmitOutcome::AlreadyActive => panic!("a new member must need verification"),
    };

    let status: String = sqlx::query_scalar("SELECT status FROM members WHERE id = $1")
        .bind(member_id)
        .fetch_one(&pool)
        .await
        .expect("status before confirm");
    assert_eq!(status, "pending_verification");

    let token = repo::issue_token(&pool, member_id, 24)
        .await
        .expect("issue token");
    assert!(repo::confirm_token(&pool, &token).await.expect("confirm"));

    let (status, verified_at): (String, Option<chrono::DateTime<chrono::Utc>>) =
        sqlx::query_as("SELECT status, verified_at FROM members WHERE id = $1")
            .bind(member_id)
            .fetch_one(&pool)
            .await
            .expect("row after confirm");
    assert_eq!(status, "active");
    assert!(verified_at.is_some());

    // Tokens are single-use.
    assert!(!repo::confirm_token(&pool, &token)
        .await
        .expect("re-confirm"));
}

#[tokio::test]
async fn rejects_non_pupr_institutional_domain() {
    let result = validate_new_member(sample("someone@gmail.com"));
    assert!(
        result.is_err(),
        "non-PUPR institutional email must be rejected"
    );
}

#[tokio::test]
async fn unknown_token_is_rejected() {
    let pool = pool().await;
    assert!(!repo::confirm_token(&pool, "not-a-real-token")
        .await
        .expect("confirm unknown token"));
}

#[tokio::test]
async fn expired_token_is_rejected() {
    let pool = pool().await;
    let member = validate_new_member(sample(&unique_email("expired"))).expect("valid submission");
    let member_id = match repo::submit_member(&pool, &member).await.expect("submit") {
        SubmitOutcome::NeedsVerification { member_id } => member_id,
        SubmitOutcome::AlreadyActive => panic!("a new member must need verification"),
    };

    // Insert an already-expired token directly, then confirm it must fail.
    let token = "expired-token-fixture";
    let hash: [u8; 32] = {
        let mut h = Sha256::new();
        h.update(token.as_bytes());
        h.finalize().into()
    };
    sqlx::query(
        "INSERT INTO member_verifications (member_id, token_hash, expires_at)
         VALUES ($1, $2, now() - interval '1 hour')",
    )
    .bind(member_id)
    .bind(&hash[..])
    .execute(&pool)
    .await
    .expect("insert expired token");

    assert!(!repo::confirm_token(&pool, token)
        .await
        .expect("confirm expired"));

    let status: String = sqlx::query_scalar("SELECT status FROM members WHERE id = $1")
        .bind(member_id)
        .fetch_one(&pool)
        .await
        .expect("status");
    assert_eq!(
        status, "pending_verification",
        "expired token must not activate"
    );
}
