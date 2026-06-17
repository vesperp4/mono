use std::net::SocketAddr;
use std::sync::Arc;

use portal_api::db;
use portal_api::email::LogEmailSender;
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
    // managed identity) in Azure. See `db::build_pool`.
    let db = db::build_pool().await?;

    sqlx::migrate!().run(&db).await?;

    let state = AppState {
        db,
        email: Arc::new(LogEmailSender),
        public_base_url,
        verification_ttl_hours,
        cors_allowed_origins,
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
