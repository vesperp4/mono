use std::sync::Arc;

use crate::db::SharedPool;
use crate::email::EmailSender;

/// Shared application state, cloned into every request handler.
#[derive(Clone)]
pub struct AppState {
    /// The Postgres pool. In Azure it is rebuilt on Entra-token refresh, so
    /// always `db.load()` it per use rather than caching the inner pool.
    pub db: SharedPool,
    /// Transactional email provider (a stub until a real one is wired).
    pub email: Arc<dyn EmailSender>,
    /// Public origin used to build verification links, e.g. `https://portal.vesperp4.com`.
    pub public_base_url: String,
    /// Lifetime of a verification link, in hours.
    pub verification_ttl_hours: i64,
    /// Browser origins allowed to call the API (CORS allowlist). The web app is
    /// served from a different origin (Static Web App) than this API, so only
    /// these origins may invoke it from a browser.
    pub cors_allowed_origins: Vec<String>,
}
