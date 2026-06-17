use chrono::{Duration, Utc};
use sha2::{Digest, Sha256};
use sqlx::PgPool;
use uuid::Uuid;

use crate::members::model::MemberRow;
use crate::members::validate::ValidatedMember;

/// Outcome of a join submission, telling the handler whether to send mail.
pub enum SubmitOutcome {
    /// A pending member exists/was created; issue a token and send the email.
    NeedsVerification { member_id: Uuid },
    /// The address already belongs to an active member; do nothing.
    AlreadyActive,
}

/// Insert a new pending member, or resolve an existing one by institutional
/// email (the unique key). Returns whether a verification email should follow.
pub async fn submit_member(db: &PgPool, m: &ValidatedMember) -> Result<SubmitOutcome, sqlx::Error> {
    let existing: Option<MemberRow> = sqlx::query_as::<_, MemberRow>(
        "SELECT id, status FROM members WHERE institutional_email = $1",
    )
    .bind(&m.institutional_email)
    .fetch_optional(db)
    .await?;

    let member_id = match existing {
        Some(row) if row.status == "active" => return Ok(SubmitOutcome::AlreadyActive),
        // Re-submission of a still-pending member: keep the row, just re-verify.
        Some(row) => row.id,
        None => {
            sqlx::query_scalar::<_, Uuid>(
                "INSERT INTO members
                     (first_name, last_name, personal_email, institutional_email,
                      concentration, department)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id",
            )
            .bind(&m.first_name)
            .bind(&m.last_name)
            .bind(&m.personal_email)
            .bind(&m.institutional_email)
            .bind(&m.concentration)
            .bind(&m.department)
            .fetch_one(db)
            .await?
        }
    };

    Ok(SubmitOutcome::NeedsVerification { member_id })
}

/// Find a still-pending member by institutional email (resend path).
pub async fn pending_member_id(
    db: &PgPool,
    institutional_email: &str,
) -> Result<Option<Uuid>, sqlx::Error> {
    sqlx::query_scalar::<_, Uuid>(
        "SELECT id FROM members
         WHERE institutional_email = $1 AND status = 'pending_verification'",
    )
    .bind(institutional_email)
    .fetch_optional(db)
    .await
}

/// Issue a fresh verification token for a member and return the RAW token (only
/// its hash is persisted). Any outstanding tokens are invalidated first, so only
/// the newest link works.
pub async fn issue_token(
    db: &PgPool,
    member_id: Uuid,
    ttl_hours: i64,
) -> Result<String, sqlx::Error> {
    let token = generate_token();
    let hash = hash_token(&token);
    let expires_at = Utc::now() + Duration::hours(ttl_hours);

    sqlx::query(
        "UPDATE member_verifications SET consumed_at = now()
         WHERE member_id = $1 AND consumed_at IS NULL",
    )
    .bind(member_id)
    .execute(db)
    .await?;

    sqlx::query(
        "INSERT INTO member_verifications (member_id, token_hash, expires_at)
         VALUES ($1, $2, $3)",
    )
    .bind(member_id)
    .bind(&hash[..])
    .bind(expires_at)
    .execute(db)
    .await?;

    Ok(token)
}

/// Consume a verification token: if it is unknown, used, or expired, return
/// `false`. Otherwise mark it consumed and activate the member, atomically.
pub async fn confirm_token(db: &PgPool, raw_token: &str) -> Result<bool, sqlx::Error> {
    let hash = hash_token(raw_token);

    let mut tx = db.begin().await?;

    let member_id: Option<Uuid> = sqlx::query_scalar::<_, Uuid>(
        "UPDATE member_verifications
            SET consumed_at = now()
          WHERE token_hash = $1
            AND consumed_at IS NULL
            AND expires_at > now()
        RETURNING member_id",
    )
    .bind(&hash[..])
    .fetch_optional(&mut *tx)
    .await?;

    let Some(member_id) = member_id else {
        tx.rollback().await?;
        return Ok(false);
    };

    sqlx::query(
        "UPDATE members
            SET status = 'active', verified_at = now(), updated_at = now()
          WHERE id = $1",
    )
    .bind(member_id)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(true)
}

/// A 256-bit random token, hex-encoded (64 URL-safe chars).
fn generate_token() -> String {
    use rand::RngCore;
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);
    hex::encode(bytes)
}

/// SHA-256 of the raw token — what we store and look up by.
fn hash_token(token: &str) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(token.as_bytes());
    hasher.finalize().into()
}
