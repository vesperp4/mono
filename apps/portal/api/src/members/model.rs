use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Allowed department slugs — must match the web form's `<option value>`s
/// (see `apps/portal/web/components/JoinForm.tsx`).
pub const DEPARTMENTS: &[&str] = &[
    "matematicas",
    "arquitectura",
    "gerencia",
    "biomedica",
    "civil",
    "industrial",
    "electrica",
    "mecanica",
];

/// Institutional email domains that prove PUPR affiliation.
pub const INSTITUTIONAL_DOMAINS: &[&str] = &["students.pupr.edu", "pupr.edu"];

/// Join-form submission payload (`POST /api/v1/members`).
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewMember {
    pub first_name: String,
    pub last_name: String,
    pub personal_email: String,
    pub institutional_email: String,
    pub concentration: String,
    pub department: String,
}

/// `POST /api/v1/members/confirm` payload.
#[derive(Debug, Deserialize)]
pub struct ConfirmRequest {
    pub token: String,
}

/// `POST /api/v1/members/resend` payload.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResendRequest {
    pub institutional_email: String,
}

/// `PATCH /api/v1/members/me` payload — the self-editable subset of a member.
///
/// Institutional email and status are deliberately absent: the type simply
/// cannot express them, and `deny_unknown_fields` turns any attempt to send
/// them (or anything else unexpected) into a `422` instead of a silent ignore.
///
/// Every field is optional = partial update: omitted (or JSON `null`, which
/// deserializes identically) means "leave unchanged". No field here is
/// nullable in the schema, so there is no "clear this field" semantic and no
/// double-`Option` is needed.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct UpdateMemberRequest {
    pub personal_email: Option<String>,
    pub concentration: Option<String>,
    pub department: Option<String>,
    pub newsletter_opt_in: Option<bool>,
}

/// The authenticated member's profile, as returned by `GET`/`PATCH`
/// `/api/v1/members/me`. Mirrors the members table; never any token or
/// session material.
#[derive(Debug, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct MemberProfile {
    pub id: Uuid,
    pub first_name: String,
    pub last_name: String,
    pub personal_email: String,
    pub institutional_email: String,
    pub concentration: String,
    pub department: String,
    pub status: String,
    pub newsletter_opt_in: bool,
    /// When the member confirmed their institutional address (their "joined"
    /// moment); `NULL` only while still pending, which `/me` can't be.
    pub verified_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

/// Minimal member row used internally to decide resend vs. no-op.
#[derive(Debug, sqlx::FromRow)]
pub struct MemberRow {
    pub id: Uuid,
    pub status: String,
}

/// Public status response (`{ "status": "..." }`).
#[derive(Debug, Serialize)]
pub struct StatusResponse {
    pub status: String,
}

impl StatusResponse {
    pub fn new(status: &str) -> Self {
        Self {
            status: status.to_string(),
        }
    }
}
