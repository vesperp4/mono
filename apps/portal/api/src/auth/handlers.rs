//! The `/api/v1/auth/*` HTTP handlers.
//!
//! Two response disciplines, chosen by who consumes the endpoint:
//! - The magic-link endpoints are called by the portal's JS and speak JSON.
//! - The OIDC endpoints are browser navigations, so every outcome — success or
//!   failure — is a redirect back into the portal; they never return JSON.

use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Redirect, Response};
use axum::Json;
use axum_extra::extract::CookieJar;
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::{magic, oidc, session};
use crate::error::AppError;
use crate::members::model::StatusResponse;
use crate::members::validate::validate_institutional_email;
use crate::state::AppState;

/// `POST /api/v1/auth/magic-link` payload.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MagicLinkRequest {
    pub institutional_email: String,
}

/// `POST /api/v1/auth/magic-link/consume` payload.
#[derive(Debug, Deserialize)]
pub struct ConsumeRequest {
    pub token: String,
}

/// Query params Entra sends to the callback: `code`+`state` on success, or an
/// `error` pair when the user cancelled / consent failed. All optional so a
/// mangled callback deserializes and falls through to the error redirect.
#[derive(Debug, Deserialize)]
pub struct OidcCallbackParams {
    pub code: Option<String>,
    pub state: Option<String>,
    pub error: Option<String>,
    pub error_description: Option<String>,
}

/// `GET /api/v1/auth/oidc/start` — redirect the browser into the Microsoft
/// sign-in dance. `503` when OIDC isn't configured (it is optional infra; the
/// magic-link flow works regardless).
pub async fn oidc_start(State(state): State<AppState>) -> Response {
    let Some(oidc) = &state.oidc else {
        return StatusCode::SERVICE_UNAVAILABLE.into_response();
    };

    match oidc.begin_auth(&state.db.load()).await {
        Ok(url) => Redirect::temporary(url.as_str()).into_response(),
        Err(err) => {
            tracing::error!(error = %err, "failed to begin OIDC auth");
            signin_error_redirect(&state, "oidc_failed").into_response()
        }
    }
}

/// `GET /api/v1/auth/oidc/callback` — finish the dance. Every failure lands on
/// the same generic sign-in error page; the one distinct code, `not_a_member`,
/// deliberately covers not-found and not-active alike, so the redirect cannot
/// be used to probe who is registered.
pub async fn oidc_callback(
    State(state): State<AppState>,
    Query(params): Query<OidcCallbackParams>,
) -> Response {
    let Some(oidc) = &state.oidc else {
        return StatusCode::SERVICE_UNAVAILABLE.into_response();
    };

    if let Some(error) = &params.error {
        tracing::warn!(
            error,
            description = params.error_description.as_deref().unwrap_or(""),
            "Entra returned an error to the OIDC callback"
        );
        return signin_error_redirect(&state, "oidc_failed").into_response();
    }
    let (Some(code), Some(cb_state)) = (params.code, params.state) else {
        return signin_error_redirect(&state, "oidc_failed").into_response();
    };

    let email = match oidc.complete_auth(&state.db.load(), &code, &cb_state).await {
        Ok(email) => email,
        Err(oidc::AuthFailure::OidcFailed) => {
            return signin_error_redirect(&state, "oidc_failed").into_response();
        }
    };

    // Sign-in NEVER creates members: a verified Microsoft identity only gets
    // in if its address already belongs to an *active* member.
    let member_id = match active_member_id(&state.db.load(), &email).await {
        Ok(Some(id)) => id,
        Ok(None) => return signin_error_redirect(&state, "not_a_member").into_response(),
        Err(err) => {
            tracing::error!(error = %err, "member lookup failed during OIDC callback");
            return signin_error_redirect(&state, "oidc_failed").into_response();
        }
    };

    match session::mint_session(&state.db.load(), member_id, state.session_ttl_days).await {
        Ok(raw) => {
            let jar = CookieJar::new().add(session::session_cookie(
                &raw,
                &state.cookie,
                state.session_ttl_days,
            ));
            (
                jar,
                Redirect::to(&format!("{}/dashboard", state.public_base_url)),
            )
                .into_response()
        }
        Err(err) => {
            tracing::error!(error = %err, "failed to mint session during OIDC callback");
            signin_error_redirect(&state, "oidc_failed").into_response()
        }
    }
}

/// `POST /api/v1/auth/magic-link` — email a one-time sign-in link. Always
/// returns `202`, regardless of whether the address belongs to an active
/// member, so the endpoint never reveals who is registered (mirrors
/// `/members/resend`). Malformed addresses still get a `400` — that judges the
/// input, not the membership roll.
pub async fn request_magic_link(
    State(state): State<AppState>,
    Json(payload): Json<MagicLinkRequest>,
) -> Result<(StatusCode, Json<StatusResponse>), AppError> {
    let email = validate_institutional_email(&payload.institutional_email)?;

    if let Some((_member_id, token)) =
        magic::request_login_token(&state.db.load(), &email, state.login_link_ttl_minutes).await?
    {
        let link = format!("{}/auth?token={}", state.public_base_url, token);
        state
            .email
            .send_login_link(&email, &link)
            .await
            .map_err(AppError::Internal)?;
    }

    Ok((StatusCode::ACCEPTED, Json(StatusResponse::new("link_sent"))))
}

/// `POST /api/v1/auth/magic-link/consume` — trade a login token for a session
/// cookie. `410` (same as `/members/confirm`) when the token is unknown, used,
/// expired, or its member is no longer active.
pub async fn consume_magic_link(
    State(state): State<AppState>,
    jar: CookieJar,
    Json(payload): Json<ConsumeRequest>,
) -> Result<(CookieJar, Json<StatusResponse>), AppError> {
    let Some(member_id) = magic::consume_login_token(&state.db.load(), &payload.token).await?
    else {
        return Err(AppError::InvalidToken);
    };

    let raw = session::mint_session(&state.db.load(), member_id, state.session_ttl_days).await?;
    let jar = jar.add(session::session_cookie(
        &raw,
        &state.cookie,
        state.session_ttl_days,
    ));

    Ok((jar, Json(StatusResponse::new("signed_in"))))
}

/// `POST /api/v1/auth/signout` — revoke the presented session (if any) and
/// clear the cookie. Always `204`: signing out with a stale or missing cookie
/// is a success, not an error.
pub async fn signout(
    State(state): State<AppState>,
    jar: CookieJar,
) -> Result<(CookieJar, StatusCode), AppError> {
    if let Some(cookie) = jar.get(session::SESSION_COOKIE) {
        session::revoke_session(&state.db.load(), cookie.value()).await?;
    }

    Ok((
        jar.add(session::clear_session_cookie(&state.cookie)),
        StatusCode::NO_CONTENT,
    ))
}

/// Look up the id of the *active* member owning this institutional email.
async fn active_member_id(db: &PgPool, email: &str) -> Result<Option<Uuid>, sqlx::Error> {
    sqlx::query_scalar::<_, Uuid>(
        "SELECT id FROM members
         WHERE institutional_email = $1 AND status = 'active'",
    )
    .bind(email)
    .fetch_optional(db)
    .await
}

/// `303` back to the portal sign-in page with a coarse error code.
fn signin_error_redirect(state: &AppState, code: &str) -> Redirect {
    Redirect::to(&format!("{}/signin?error={}", state.public_base_url, code))
}
