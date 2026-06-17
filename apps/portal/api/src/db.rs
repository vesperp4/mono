//! Database pool construction and (in Azure) Entra-token refresh.
//!
//! Two connection modes:
//! - **Local / CI:** if `DATABASE_URL` is set, connect with it directly (the
//!   Postgres container used by tests and local dev). No refresh.
//! - **Azure (passwordless):** otherwise assemble the connection from the `PG*`
//!   env vars the Container App injects and authenticate with an Entra access
//!   token from the app's user-assigned managed identity (`AZURE_CLIENT_ID`),
//!   used as the Postgres password. No secret is stored.
//!
//! The Entra token is short-lived (~24h). Dev replicas scale to zero and
//! cold-start with a fresh token, but a long-lived prod replica would see its
//! token expire, so passwordless mode spawns a background task that rebuilds the
//! pool with a fresh token shortly before the current one expires. Callers hold
//! the pool through an [`ArcSwap`] and always `.load()` the current one.

use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use anyhow::Context;
use arc_swap::ArcSwap;
use sqlx::postgres::{PgConnectOptions, PgPool, PgPoolOptions, PgSslMode};

/// Entra scope for Azure Database for PostgreSQL Flexible Server.
const PG_TOKEN_SCOPE: &str = "https://ossrdbms-aad.database.windows.net/.default";

/// Rebuild the pool this many seconds before the token expires.
const REFRESH_LEAD_SECS: i64 = 300;

/// A pool handle that may be transparently rebuilt (passwordless mode) when the
/// Entra token nears expiry. Always `.load()` it per use rather than caching.
pub type SharedPool = Arc<ArcSwap<PgPool>>;

/// Initialize the database pool (see the module docs for the two modes).
pub async fn init() -> anyhow::Result<SharedPool> {
    if let Ok(url) = std::env::var("DATABASE_URL") {
        tracing::info!("connecting to Postgres via DATABASE_URL");
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(&url)
            .await
            .context("connecting via DATABASE_URL")?;
        return Ok(Arc::new(ArcSwap::from_pointee(pool)));
    }

    tracing::info!("connecting to Postgres passwordless (Entra token via managed identity)");
    let (pool, expires_at) = connect_passwordless().await?;
    let shared: SharedPool = Arc::new(ArcSwap::from_pointee(pool));
    spawn_token_refresh(shared.clone(), expires_at);
    Ok(shared)
}

/// Build a passwordless pool, returning it with the token's expiry (unix secs).
async fn connect_passwordless() -> anyhow::Result<(PgPool, i64)> {
    let host = env_var("PGHOST")?;
    let user = env_var("PGUSER")?;
    let database = env_var("PGDATABASE")?;
    let port: u16 = std::env::var("PGPORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(5432);
    let ssl_mode = match std::env::var("PGSSLMODE").as_deref() {
        Ok("disable") => PgSslMode::Disable,
        Ok("allow") => PgSslMode::Allow,
        Ok("prefer") => PgSslMode::Prefer,
        Ok("verify-ca") => PgSslMode::VerifyCa,
        Ok("verify-full") => PgSslMode::VerifyFull,
        // Flexible Server requires TLS; default to `require`.
        _ => PgSslMode::Require,
    };

    let (token, expires_at) = fetch_pg_access_token().await?;

    let options = PgConnectOptions::new()
        .host(&host)
        .port(port)
        .username(&user)
        .database(&database)
        .password(&token)
        .ssl_mode(ssl_mode);

    let pool = PgPoolOptions::new()
        .max_connections(5)
        // Recycle connections so none lingers far past the current token.
        .max_lifetime(Duration::from_secs(30 * 60))
        .connect_with(options)
        .await
        .context("connecting passwordless to Postgres")?;

    Ok((pool, expires_at))
}

/// Background task: rebuild the pool with a fresh token shortly before expiry
/// and swap it in. On failure it keeps the existing pool and retries soon.
fn spawn_token_refresh(shared: SharedPool, mut expires_at: i64) {
    tokio::spawn(async move {
        loop {
            let sleep_secs = (expires_at - unix_now() - REFRESH_LEAD_SECS).max(60) as u64;
            tokio::time::sleep(Duration::from_secs(sleep_secs)).await;

            match connect_passwordless().await {
                Ok((pool, new_expires)) => {
                    shared.store(Arc::new(pool));
                    expires_at = new_expires;
                    tracing::info!("rebuilt DB pool with a refreshed Entra token");
                }
                Err(err) => {
                    tracing::error!(error = %err, "DB token refresh failed; retrying in 60s");
                    expires_at = unix_now() + 60;
                }
            }
        }
    });
}

/// Obtain an Entra access token for Azure Database for PostgreSQL via the app's
/// user-assigned managed identity (`AZURE_CLIENT_ID`). Returns the token and its
/// expiry as a unix timestamp.
async fn fetch_pg_access_token() -> anyhow::Result<(String, i64)> {
    use azure_core::credentials::TokenCredential;
    use azure_identity::{
        ManagedIdentityCredential, ManagedIdentityCredentialOptions, UserAssignedId,
    };

    let client_id = env_var("AZURE_CLIENT_ID")?;
    let credential = ManagedIdentityCredential::new(Some(ManagedIdentityCredentialOptions {
        user_assigned_id: Some(UserAssignedId::ClientId(client_id)),
        ..Default::default()
    }))
    .map_err(|e| anyhow::anyhow!("building managed-identity credential: {e}"))?;

    let token = credential
        .get_token(&[PG_TOKEN_SCOPE], None)
        .await
        .map_err(|e| anyhow::anyhow!("acquiring Postgres access token: {e}"))?;

    Ok((
        token.token.secret().to_string(),
        token.expires_on.unix_timestamp(),
    ))
}

fn unix_now() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

fn env_var(key: &str) -> anyhow::Result<String> {
    std::env::var(key).with_context(|| format!("{key} must be set"))
}
