use axum::extract::State;
use axum::http::StatusCode;
use axum::Json;

use crate::auth::extract::CurrentMember;
use crate::error::AppError;
use crate::members::model::{
    ConfirmRequest, MemberProfile, NewMember, ResendRequest, StatusResponse, UpdateMemberRequest,
};
use crate::members::repo::{self, SubmitOutcome};
use crate::members::validate::{
    validate_institutional_email, validate_member_update, validate_new_member,
};
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

    match repo::submit_member(&state.db.load(), &member).await? {
        SubmitOutcome::NeedsVerification { member_id } => {
            // Per-address cooldown: if a verification email just went out, do
            // not send another — the earlier link still works, and the `202`
            // below is unchanged (no enumeration signal).
            if repo::recently_issued(&state.db.load(), member_id, state.email_cooldown_seconds)
                .await?
            {
                tracing::info!("verification email cooldown active — not re-sending");
            } else {
                let token =
                    repo::issue_token(&state.db.load(), member_id, state.verification_ttl_hours)
                        .await?;
                spawn_verification_email(&state, &member.institutional_email, &token);
            }
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
    if repo::confirm_token(&state.db.load(), &payload.token).await? {
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

    if let Some(member_id) = repo::pending_member_id(&state.db.load(), &email).await? {
        // Same per-address cooldown as the join path (see `create_member`).
        if repo::recently_issued(&state.db.load(), member_id, state.email_cooldown_seconds).await? {
            tracing::info!("verification email cooldown active — not re-sending");
        } else {
            let token =
                repo::issue_token(&state.db.load(), member_id, state.verification_ttl_hours)
                    .await?;
            spawn_verification_email(&state, &email, &token);
        }
    }

    Ok((
        StatusCode::ACCEPTED,
        Json(StatusResponse::new("pending_verification")),
    ))
}

/// `GET /api/v1/members/me` — the authenticated member's profile. Auth is
/// entirely the [`CurrentMember`] extractor; reaching the body means the
/// session is valid and the member is active.
pub async fn get_me(
    State(state): State<AppState>,
    CurrentMember(member): CurrentMember,
) -> Result<Json<MemberProfile>, AppError> {
    let profile = repo::member_profile(&state.db.load(), member.member_id)
        .await?
        // The row vanished between session validation and this read — treat it
        // like any other dead session.
        .ok_or(AppError::Unauthorized)?;

    Ok(Json(profile))
}

/// `PATCH /api/v1/members/me` — partial self-service update of the mutable
/// fields (personal email, concentration, department, newsletter opt-in);
/// returns the updated profile in the same shape as `GET`. The payload type
/// cannot express institutional email or status, and its
/// `deny_unknown_fields` makes sending them a `422`.
pub async fn update_me(
    State(state): State<AppState>,
    CurrentMember(member): CurrentMember,
    Json(payload): Json<UpdateMemberRequest>,
) -> Result<Json<MemberProfile>, AppError> {
    let update = validate_member_update(payload)?;

    let profile = repo::update_member_profile(&state.db.load(), member.member_id, &update)
        .await?
        .ok_or(AppError::Unauthorized)?;

    Ok(Json(profile))
}

/// Build the confirmation URL and send it in the background. Fire-and-forget on
/// purpose: the HTTP response must not wait on — or reflect the success of — the
/// send, so timing and status are identical whether or not the address is a real
/// pending member (no enumeration signal; an ACS failure must never turn into a
/// 500 for a registered address while an unknown one gets 202). Failures are
/// logged. Best-effort across shutdown; the user can re-request.
fn spawn_verification_email(state: &AppState, to: &str, token: &str) {
    let email = state.email.clone();
    let to = to.to_string();
    let link = format!("{}/confirm?token={}", state.public_base_url, token);
    tokio::spawn(async move {
        if let Err(err) = email.send_verification(&to, &link).await {
            tracing::error!(target: "email", error = %err, "verification email send failed");
        }
    });
}
