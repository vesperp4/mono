use std::net::SocketAddr;
use std::sync::Arc;

use anyhow::Context;
use portal_api::auth::oidc::{ClientCredential, OidcConfig};
use portal_api::auth::session::CookieConfig;
use portal_api::db;
use portal_api::email::{AcsEmailSender, EmailSender, LogEmailSender};
use portal_api::router;
use portal_api::state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .init();

    // Origin the verification link points at (the portal web app, which hosts
    // the /confirm page). Defaults to prod.
    let public_base_url = std::env::var("PUBLIC_BASE_URL")
        .unwrap_or_else(|_| "https://portal.vesperp4.com".to_string());

    // How long a verification link stays valid before it must be re-requested.
    let verification_ttl_hours = std::env::var("VERIFICATION_TTL_HOURS")
        .ok()
        .and_then(|v| v.parse::<i64>().ok())
        .unwrap_or(24);

    // How long a sign-in session (and its cookie) lasts before re-auth.
    let session_ttl_days = std::env::var("SESSION_TTL_DAYS")
        .ok()
        .and_then(|v| v.parse::<i64>().ok())
        .unwrap_or(30);

    // How long a magic sign-in link stays valid. Much shorter than the
    // verification link: this one grants access, not just proof of an address.
    let login_link_ttl_minutes = std::env::var("LOGIN_LINK_TTL_MINUTES")
        .ok()
        .and_then(|v| v.parse::<i64>().ok())
        .unwrap_or(15);

    // Session-cookie scoping. No COOKIE_DOMAIN means a host-only cookie (what
    // localhost dev wants); COOKIE_SECURE defaults on and is only disabled for
    // plain-HTTP local dev.
    let cookie = CookieConfig {
        domain: std::env::var("COOKIE_DOMAIN")
            .ok()
            .filter(|v| !v.is_empty()),
        secure: std::env::var("COOKIE_SECURE")
            .ok()
            .and_then(|v| v.parse::<bool>().ok())
            .unwrap_or(true),
    };

    // Browser origins allowed to call this API (comma-separated). Defaults to the
    // portal origin (`public_base_url`) so the portal's signup/confirm pages work.
    let cors_allowed_origins = std::env::var("CORS_ALLOWED_ORIGINS")
        .ok()
        .map(|v| {
            v.split(',')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect::<Vec<_>>()
        })
        .unwrap_or_else(|| vec![public_base_url.clone()]);

    // Connects via DATABASE_URL locally, or passwordless (Entra token via the
    // managed identity) in Azure, with background token refresh. See `db::init`.
    let db = db::init().await?;

    sqlx::migrate!().run(&**db.load()).await?;

    // Use Azure Communication Services when the infra has wired its endpoint +
    // sender; otherwise fall back to the log-only stub (local/CI, or before the
    // managed identity is granted send access). Selecting on env keeps handlers
    // and tests provider-agnostic.
    let email: Arc<dyn EmailSender> = match (
        std::env::var("ACS_ENDPOINT"),
        std::env::var("ACS_SENDER_ADDRESS"),
    ) {
        (Ok(endpoint), Ok(sender)) if !endpoint.is_empty() && !sender.is_empty() => {
            tracing::info!(
                endpoint,
                sender,
                "sending verification mail via Azure Communication Services"
            );
            Arc::new(AcsEmailSender::new(endpoint, sender)?)
        }
        _ => {
            tracing::info!(
                "ACS not configured — using LogEmailSender (links are logged, not emailed)"
            );
            Arc::new(LogEmailSender)
        }
    };

    // Microsoft OIDC sign-in is optional: enabled only when the app
    // registration's three identifiers are all set (infra wires them in Azure);
    // otherwise the /auth/oidc/* routes return 503 and only the magic-link flow
    // is available. A client secret, if present, wins over the passwordless
    // managed-identity federated credential — that's the local-dev escape hatch.
    let oidc = match (
        std::env::var("OIDC_CLIENT_ID"),
        std::env::var("OIDC_TENANT_ID"),
        std::env::var("OIDC_REDIRECT_URI"),
    ) {
        (Ok(client_id), Ok(tenant_id), Ok(redirect_uri))
            if !client_id.is_empty() && !tenant_id.is_empty() && !redirect_uri.is_empty() =>
        {
            let credential = match std::env::var("OIDC_CLIENT_SECRET") {
                Ok(secret) if !secret.is_empty() => {
                    tracing::info!("OIDC sign-in enabled (client-secret credential)");
                    ClientCredential::Secret(secret)
                }
                _ => {
                    let mi_client_id = std::env::var("AZURE_CLIENT_ID").context(
                        "AZURE_CLIENT_ID must be set for the OIDC managed-identity \
                         federated credential (or set OIDC_CLIENT_SECRET)",
                    )?;
                    tracing::info!("OIDC sign-in enabled (managed-identity federated credential)");
                    ClientCredential::ManagedIdentityFederated {
                        client_id: mi_client_id,
                    }
                }
            };
            Some(Arc::new(OidcConfig::new(
                client_id,
                tenant_id,
                redirect_uri,
                credential,
            )?))
        }
        _ => {
            tracing::info!("OIDC not configured — /auth/oidc/* will return 503");
            None
        }
    };

    let state = AppState {
        db,
        email,
        public_base_url,
        verification_ttl_hours,
        cors_allowed_origins,
        session_ttl_days,
        login_link_ttl_minutes,
        cookie,
        oidc,
    };

    let app = router::build_router(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    tracing::info!("listening on {addr}");
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

async fn shutdown_signal() {
    let _ = tokio::signal::ctrl_c().await;
    tracing::info!("shutdown signal received");
}
