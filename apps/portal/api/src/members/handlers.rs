use axum::extract::State;
use axum::http::StatusCode;
use axum::Json;

use crate::error::AppError;
use crate::members::model::{ConfirmRequest, NewMember, ResendRequest, StatusResponse};
use crate::members::repo::{self, SubmitOutcome};
use crate::members::validate::{validate_institutional_email, validate_new_member};
use crate::state::AppState;

/// `POST /api/v1/members` — accept a join submission and (re)send a verification
/// link to the institutional address. Always returns `202`, regardless of
/// whether the address is new, pending, or already active, so the endpoint never
/// reveals who is registered.
pub async fn create_member(
    State(state): State<AppState>,
    Json(payload): Json<NewMember>,
) -> Result<(StatusCode, Json<StatusResponse>), AppError> {
    let member = validate_new_member(payload)?;

    match repo::submit_member(&state.db, &member).await? {
        SubmitOutcome::NeedsVerification { member_id } => {
            let token =
                repo::issue_token(&state.db, member_id, state.verification_ttl_hours).await?;
            send_link(&state, &member.institutional_email, &token).await?;
        }
        SubmitOutcome::AlreadyActive => {
            tracing::info!("join submission for an already-active member — ignored");
        }
    }

    Ok((
        StatusCode::ACCEPTED,
        Json(StatusResponse::new("pending_verification")),
    ))
}

/// `POST /api/v1/members/confirm` — activate a member from a verification token.
pub async fn confirm_member(
    State(state): State<AppState>,
    Json(payload): Json<ConfirmRequest>,
) -> Result<Json<StatusResponse>, AppError> {
    if repo::confirm_token(&state.db, &payload.token).await? {
        Ok(Json(StatusResponse::new("active")))
    } else {
        Err(AppError::InvalidToken)
    }
}

/// `POST /api/v1/members/resend` — re-issue a link for a still-pending member.
/// Generic `202` whether or not a pending member exists.
pub async fn resend_verification(
    State(state): State<AppState>,
    Json(payload): Json<ResendRequest>,
) -> Result<(StatusCode, Json<StatusResponse>), AppError> {
    let email = validate_institutional_email(&payload.institutional_email)?;

    if let Some(member_id) = repo::pending_member_id(&state.db, &email).await? {
        let token = repo::issue_token(&state.db, member_id, state.verification_ttl_hours).await?;
        send_link(&state, &email, &token).await?;
    }

    Ok((
        StatusCode::ACCEPTED,
        Json(StatusResponse::new("pending_verification")),
    ))
}

/// Build the confirmation URL and hand it to the email provider.
async fn send_link(state: &AppState, to: &str, token: &str) -> Result<(), AppError> {
    let link = format!("{}/confirm?token={}", state.public_base_url, token);
    state
        .email
        .send_verification(to, &link)
        .await
        .map_err(AppError::Internal)
}
