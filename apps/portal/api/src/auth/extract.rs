//! The `CurrentMember` extractor — how a handler says "this endpoint requires
//! a signed-in member".
//!
//! Adding `CurrentMember(member): CurrentMember` to a handler's arguments is
//! the whole auth story for member-facing endpoints: the extractor reads the
//! session cookie and resolves it through [`session::validate_session`], so
//! "what counts as signed in" stays defined in one place. Every failure —
//! missing cookie, unknown/expired/revoked session, member no longer active —
//! is the same generic [`AppError::Unauthorized`] (401); the reason is never
//! disclosed.

use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use axum_extra::extract::CookieJar;

use crate::auth::session::{self, SessionMember};
use crate::error::AppError;
use crate::state::AppState;

/// The member behind the request's session cookie. Only exists for a valid
/// session belonging to an *active* member — a handler holding one never needs
/// to re-check status.
#[derive(Debug)]
pub struct CurrentMember(pub SessionMember);

impl FromRequestParts<AppState> for CurrentMember {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let jar = CookieJar::from_headers(&parts.headers);
        let cookie = jar
            .get(session::SESSION_COOKIE)
            .ok_or(AppError::Unauthorized)?;

        let member = session::validate_session(&state.db.load(), cookie.value())
            .await?
            .ok_or(AppError::Unauthorized)?;

        Ok(CurrentMember(member))
    }
}
