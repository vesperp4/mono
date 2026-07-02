//! Server-side sessions and the session cookie.
//!
//! A session is a random 256-bit bearer token handed to the browser in an
//! HttpOnly cookie; the database stores only its SHA-256 (same discipline as
//! verification tokens). Server-side rows — rather than a signed/stateless
//! JWT — so sign-out and member-status changes take effect immediately: a
//! revoked session or a deactivated member is rejected on the very next
//! request, with no wait for a token to expire.
//!
//! This module is the single owner of session semantics. The member-facing
//! portal endpoints (#172) authenticate exclusively through
//! [`validate_session`], so "what counts as signed in" is defined here and
//! nowhere else.

use axum_extra::extract::cookie::{Cookie, SameSite};
use chrono::{Duration, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use crate::token::{generate_token, hash_token};

/// Name of the session cookie.
pub const SESSION_COOKIE: &str = "vp4_session";

/// How the session cookie is scoped, resolved once at startup from env.
#[derive(Clone)]
pub struct CookieConfig {
    /// Cookie `Domain`. `None` issues a host-only cookie — what you want for
    /// `localhost` dev; in prod it is set so the cookie reaches the API origin.
    pub domain: Option<String>,
    /// Cookie `Secure`. Default on; disabled only for plain-HTTP local dev.
    pub secure: bool,
}

/// The member behind a valid session — everything the member-facing endpoints
/// (#172) need to render "who am I" without a second query.
#[derive(Debug, sqlx::FromRow)]
pub struct SessionMember {
    pub member_id: Uuid,
    pub first_name: String,
    pub last_name: String,
    pub institutional_email: String,
    pub status: String,
}

/// Create a session for a member and return the RAW token (only its hash is
/// persisted). Callers put the raw value in the cookie via [`session_cookie`].
/// Deliberately does not touch other sessions: each browser/device gets its
/// own row, and sign-out revokes only the one presented.
pub async fn mint_session(
    db: &PgPool,
    member_id: Uuid,
    ttl_days: i64,
) -> Result<String, sqlx::Error> {
    let token = generate_token();
    let hash = hash_token(&token);
    let expires_at = Utc::now() + Duration::days(ttl_days);

    sqlx::query(
        "INSERT INTO sessions (member_id, token_hash, expires_at)
         VALUES ($1, $2, $3)",
    )
    .bind(member_id)
    .bind(&hash[..])
    .bind(expires_at)
    .execute(db)
    .await?;

    Ok(token)
}

/// Resolve a raw session token to its member, or `None` if the session is
/// unknown, expired, revoked, **or the member is no longer active** — a member
/// moved to alumni/rejected loses access on their next request, even with a
/// live cookie.
pub async fn validate_session(
    db: &PgPool,
    raw_token: &str,
) -> Result<Option<SessionMember>, sqlx::Error> {
    let hash = hash_token(raw_token);

    sqlx::query_as::<_, SessionMember>(
        "SELECT m.id AS member_id, m.first_name, m.last_name,
                m.institutional_email, m.status
           FROM sessions s
           JOIN members m ON m.id = s.member_id
          WHERE s.token_hash = $1
            AND s.revoked_at IS NULL
            AND s.expires_at > now()
            AND m.status = 'active'",
    )
    .bind(&hash[..])
    .fetch_optional(db)
    .await
}

/// Revoke a session by its raw token. Idempotent, and quiet about unknown
/// tokens — sign-out must never error just because the cookie was stale.
pub async fn revoke_session(db: &PgPool, raw_token: &str) -> Result<(), sqlx::Error> {
    let hash = hash_token(raw_token);

    sqlx::query(
        "UPDATE sessions SET revoked_at = now()
         WHERE token_hash = $1 AND revoked_at IS NULL",
    )
    .bind(&hash[..])
    .execute(db)
    .await?;

    Ok(())
}

/// Build the session cookie: HttpOnly (no script access), `SameSite=Lax` (sent
/// on top-level navigations — needed for the OIDC redirect back into the
/// portal — but not on cross-site subrequests), scoped per [`CookieConfig`].
pub fn session_cookie(raw_token: &str, cfg: &CookieConfig, ttl_days: i64) -> Cookie<'static> {
    let mut cookie = base_cookie(cfg, raw_token.to_string());
    cookie.set_max_age(time::Duration::days(ttl_days));
    cookie
}

/// An expired, empty twin of the session cookie — setting it deletes the real
/// one. Attributes must match [`session_cookie`] or browsers keep both.
pub fn clear_session_cookie(cfg: &CookieConfig) -> Cookie<'static> {
    let mut cookie = base_cookie(cfg, String::new());
    cookie.set_max_age(time::Duration::ZERO);
    cookie
}

fn base_cookie(cfg: &CookieConfig, value: String) -> Cookie<'static> {
    let mut cookie = Cookie::new(SESSION_COOKIE, value);
    cookie.set_http_only(true);
    cookie.set_path("/");
    cookie.set_same_site(SameSite::Lax);
    cookie.set_secure(cfg.secure);
    if let Some(domain) = &cfg.domain {
        cookie.set_domain(domain.clone());
    }
    cookie
}
