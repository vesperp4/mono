use std::sync::Arc;

use crate::auth::oidc::OidcConfig;
use crate::auth::session::CookieConfig;
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
    /// Lifetime of a sign-in session (and its cookie), in days.
    pub session_ttl_days: i64,
    /// Lifetime of a magic sign-in link, in minutes. Short: it grants access,
    /// unlike the verification link which merely proves an address.
    pub login_link_ttl_minutes: i64,
    /// Session-cookie scoping (Domain/Secure).
    pub cookie: CookieConfig,
    /// Microsoft OIDC sign-in, when configured. `None` makes the
    /// `/auth/oidc/*` endpoints return `503`; the magic-link flow is
    /// unaffected.
    pub oidc: Option<Arc<OidcConfig>>,
}
