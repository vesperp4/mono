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

    // Per-client-IP allowance per minute on the public email-sending endpoints
    // (join, resend, magic-link). They legitimately see at most a few requests
    // per user per minute, so the default is deliberately tight.
    let rate_limit_per_minute = std::env::var("RATE_LIMIT_PER_MINUTE")
        .ok()
        .and_then(|v| v.parse::<u32>().ok())
        .unwrap_or(5);

    // Minimum gap between emails to the same address (verification links and
    // magic links each on their own clock). 0 disables.
    let email_cooldown_seconds = std::env::var("EMAIL_COOLDOWN_SECONDS")
        .ok()
        .and_then(|v| v.parse::<i64>().ok())
        .unwrap_or(30);

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
            // Fail closed: the log-only sender writes raw sign-in links (which
            // contain single-use tokens) to the logs — fine for local/CI, but in
            // a deployed environment it would stream replayable credentials into
            // Log Analytics. Require an explicit opt-in so a dropped ACS_* var in
            // Azure refuses to boot instead of silently falling back.
            let allow_log_sender = std::env::var("ALLOW_LOG_EMAIL_SENDER")
                .ok()
                .and_then(|v| v.parse::<bool>().ok())
                .unwrap_or(false);
            if !allow_log_sender {
                anyhow::bail!(
                    "email is not configured: set ACS_ENDPOINT and ACS_SENDER_ADDRESS, or set \
                     ALLOW_LOG_EMAIL_SENDER=true for local/CI. Refusing to start with the \
                     log-only email sender in a deployed environment — it logs raw sign-in tokens."
                );
            }
            tracing::warn!(
                "ACS not configured — using LogEmailSender (sign-in links are LOGGED, not \
                 emailed). Local/CI only; never use in a deployed environment."
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
        rate_limit_per_minute,
        email_cooldown_seconds,
        oidc,
    };

    let app = router::build_router(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    tracing::info!("listening on {addr}");
    // Connect info gives the rate limiter its peer-address fallback for
    // requests without X-Forwarded-For (local dev / direct calls).
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown_signal())
    .await?;

    Ok(())
}

async fn shutdown_signal() {
    // Azure Container Apps (and container runtimes generally) send SIGTERM on
    // stop/scale-down; Rust's default disposition kills the process immediately,
    // so without an explicit handler `with_graceful_shutdown` never runs and
    // in-flight requests are cut. Handle SIGTERM alongside SIGINT (Ctrl-C).
    #[cfg(unix)]
    {
        use tokio::signal::unix::{signal, SignalKind};
        let mut sigterm = match signal(SignalKind::terminate()) {
            Ok(s) => s,
            Err(err) => {
                tracing::error!(error = %err, "failed to install SIGTERM handler");
                return;
            }
        };
        tokio::select! {
            _ = tokio::signal::ctrl_c() => tracing::info!("SIGINT received, shutting down"),
            _ = sigterm.recv() => tracing::info!("SIGTERM received, shutting down"),
        }
    }
    #[cfg(not(unix))]
    {
        let _ = tokio::signal::ctrl_c().await;
        tracing::info!("shutdown signal received");
    }
}
