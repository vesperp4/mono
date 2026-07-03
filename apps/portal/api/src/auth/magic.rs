//! Magic-link sign-in: one-time email login tokens.
//!
//! Same shape as the members verification flow (issue/consume, hash-only
//! storage, newest-link-wins) but strictly read-only on `members`: a login
//! token is only ever issued to an already-active member, and consuming one
//! never touches member status or `verified_at`.

use chrono::{Duration, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use crate::token::{generate_token, hash_token};

/// Issue a login token for an **active** member with this institutional email,
/// returning the member id and the RAW token (only its hash is persisted).
/// Returns `None` if no active member matches — unknown, pending, alumni and
/// rejected addresses all look identical, and none is ever created here.
/// Outstanding tokens are invalidated first, so only the newest link works.
pub async fn request_login_token(
    db: &PgPool,
    institutional_email: &str,
    ttl_minutes: i64,
) -> Result<Option<(Uuid, String)>, sqlx::Error> {
    let member_id: Option<Uuid> = sqlx::query_scalar::<_, Uuid>(
        "SELECT id FROM members
         WHERE institutional_email = $1 AND status = 'active'",
    )
    .bind(institutional_email)
    .fetch_optional(db)
    .await?;

    let Some(member_id) = member_id else {
        return Ok(None);
    };

    let token = generate_token();
    let hash = hash_token(&token);
    let expires_at = Utc::now() + Duration::minutes(ttl_minutes);

    sqlx::query(
        "UPDATE login_tokens SET consumed_at = now()
         WHERE member_id = $1 AND consumed_at IS NULL",
    )
    .bind(member_id)
    .execute(db)
    .await?;

    sqlx::query(
        "INSERT INTO login_tokens (member_id, token_hash, expires_at)
         VALUES ($1, $2, $3)",
    )
    .bind(member_id)
    .bind(&hash[..])
    .bind(expires_at)
    .execute(db)
    .await?;

    Ok(Some((member_id, token)))
}

/// True when a login token (and thus an email) already went out for this
/// address within the last `cooldown_secs`. The handler uses this to skip
/// re-sending — the earlier link is still the valid one — bounding how fast a
/// third party can make us email an address. Unknown addresses simply have no
/// tokens, so this stays enumeration-neutral. `0` disables.
pub async fn recently_requested(
    db: &PgPool,
    institutional_email: &str,
    cooldown_secs: i64,
) -> Result<bool, sqlx::Error> {
    sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS (
            SELECT 1
              FROM login_tokens lt
              JOIN members m ON m.id = lt.member_id
             WHERE m.institutional_email = $1
               AND lt.created_at > now() - make_interval(secs => $2)
        )",
    )
    .bind(institutional_email)
    .bind(cooldown_secs as f64)
    .fetch_one(db)
    .await
}

/// Consume a login token: if it is unknown, used, expired, or its member is no
/// longer active, return `None`. Otherwise mark it consumed and return the
/// member id, atomically — the UPDATE both locks the row and burns the token,
/// so two concurrent consumers cannot both sign in on one link. Never mutates
/// member status or `verified_at`: signing in proves nothing new about the
/// address that verification hasn't already established.
pub async fn consume_login_token(
    db: &PgPool,
    raw_token: &str,
) -> Result<Option<Uuid>, sqlx::Error> {
    let hash = hash_token(raw_token);

    let mut tx = db.begin().await?;

    let member_id: Option<Uuid> = sqlx::query_scalar::<_, Uuid>(
        "UPDATE login_tokens
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
        return Ok(None);
    };

    // Re-check status inside the same transaction: a member deactivated after
    // the link was emailed must not be able to sign in with it.
    let is_active: Option<bool> =
        sqlx::query_scalar::<_, bool>("SELECT status = 'active' FROM members WHERE id = $1")
            .bind(member_id)
            .fetch_optional(&mut *tx)
            .await?;

    if is_active != Some(true) {
        tx.rollback().await?;
        return Ok(None);
    }

    tx.commit().await?;
    Ok(Some(member_id))
}
