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
