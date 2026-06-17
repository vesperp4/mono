//! Database pool construction.
//!
//! Two connection modes:
//! - **Local / CI:** if `DATABASE_URL` is set, connect with it directly (the
//!   Postgres container used by tests and local dev).
//! - **Azure (passwordless):** otherwise assemble the connection from the `PG*`
//!   env vars the Container App injects and authenticate with an Entra access
//!   token obtained via the app's user-assigned managed identity
//!   (`AZURE_CLIENT_ID`), used as the Postgres password. No secret is stored.
//!
//! TODO(token-refresh): the Entra token is fetched once at startup and is valid
//! ~24h. Dev replicas scale to zero and cold-start with a fresh token, so they
//! are unaffected. A long-lived (prod, `minReplicas >= 1`) replica must refresh
//! before expiry — rebuild the pool with a fresh token on an interval (e.g. an
//! `arc_swap::ArcSwap<PgPool>` in `AppState` swapped by a background task) before
//! it carries sustained always-on traffic.

use std::time::Duration;

use anyhow::Context;
use sqlx::postgres::{PgConnectOptions, PgPool, PgPoolOptions, PgSslMode};

/// Entra scope for Azure Database for PostgreSQL Flexible Server.
const PG_TOKEN_SCOPE: &str = "https://ossrdbms-aad.database.windows.net/.default";

/// Build the application's Postgres pool (see the module docs for the two modes).
pub async fn build_pool() -> anyhow::Result<PgPool> {
    if let Ok(url) = std::env::var("DATABASE_URL") {
        tracing::info!("connecting to Postgres via DATABASE_URL");
        return PgPoolOptions::new()
            .max_connections(5)
            .connect(&url)
            .await
            .context("connecting via DATABASE_URL");
    }

    tracing::info!("connecting to Postgres passwordless (Entra token via managed identity)");
    let options = passwordless_options().await?;
    PgPoolOptions::new()
        .max_connections(5)
        // Recycle connections so none lingers far past the Entra token's life;
        // see the token-refresh TODO in the module docs.
        .max_lifetime(Duration::from_secs(30 * 60))
        .connect_with(options)
        .await
        .context("connecting passwordless to Postgres")
}

/// Assemble `PgConnectOptions` from the injected `PG*` env vars, using a freshly
/// minted Entra access token as the password.
async fn passwordless_options() -> anyhow::Result<PgConnectOptions> {
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

    let token = fetch_pg_access_token().await?;

    Ok(PgConnectOptions::new()
        .host(&host)
        .port(port)
        .username(&user)
        .database(&database)
        .password(&token)
        .ssl_mode(ssl_mode))
}

/// Obtain an Entra access token for Azure Database for PostgreSQL via the app's
/// user-assigned managed identity (`AZURE_CLIENT_ID`).
async fn fetch_pg_access_token() -> anyhow::Result<String> {
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

    Ok(token.token.secret().to_string())
}

fn env_var(key: &str) -> anyhow::Result<String> {
    std::env::var(key).with_context(|| format!("{key} must be set"))
}
