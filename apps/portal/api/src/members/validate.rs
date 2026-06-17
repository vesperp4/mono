use crate::error::AppError;
use crate::members::model::{NewMember, DEPARTMENTS, INSTITUTIONAL_DOMAINS};

/// A validated, normalized join submission ready to persist.
pub struct ValidatedMember {
    pub first_name: String,
    pub last_name: String,
    pub personal_email: String,
    pub institutional_email: String,
    pub concentration: String,
    pub department: String,
}

/// Validate and normalize a join submission. Emails are lowercased; the
/// institutional address must be a recognized PUPR domain.
pub fn validate_new_member(input: NewMember) -> Result<ValidatedMember, AppError> {
    let first_name = non_empty(&input.first_name, "firstName")?;
    let last_name = non_empty(&input.last_name, "lastName")?;
    let concentration = non_empty(&input.concentration, "concentration")?;

    let personal_email = normalize_email(&input.personal_email);
    if !looks_like_email(&personal_email) {
        return Err(AppError::Validation(
            "personalEmail is not a valid email".into(),
        ));
    }

    let institutional_email = validate_institutional_email(&input.institutional_email)?;

    let department = input.department.trim().to_string();
    if !DEPARTMENTS.contains(&department.as_str()) {
        return Err(AppError::Validation(
            "department is not a recognized value".into(),
        ));
    }

    Ok(ValidatedMember {
        first_name,
        last_name,
        personal_email,
        institutional_email,
        concentration,
        department,
    })
}

/// Validate + normalize an institutional email (also used by the resend path).
pub fn validate_institutional_email(raw: &str) -> Result<String, AppError> {
    let email = normalize_email(raw);
    if !looks_like_email(&email) || !has_institutional_domain(&email) {
        return Err(AppError::Validation(
            "institutionalEmail must be a PUPR address (@students.pupr.edu or @pupr.edu)".into(),
        ));
    }
    Ok(email)
}

fn non_empty(value: &str, field: &str) -> Result<String, AppError> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err(AppError::Validation(format!("{field} is required")));
    }
    Ok(trimmed.to_string())
}

fn normalize_email(raw: &str) -> String {
    raw.trim().to_lowercase()
}

/// Minimal structural email check (no RFC-5322 parsing): exactly one `@`, a
/// non-empty local part, and a dotted domain. Good enough to reject obvious
/// garbage; the verification email is the real proof the address works.
fn looks_like_email(email: &str) -> bool {
    let mut parts = email.split('@');
    let (local, domain) = match (parts.next(), parts.next(), parts.next()) {
        (Some(local), Some(domain), None) => (local, domain),
        _ => return false,
    };
    !local.is_empty() && domain.contains('.') && !domain.starts_with('.') && !domain.ends_with('.')
}

fn has_institutional_domain(email: &str) -> bool {
    match email.split('@').nth(1) {
        Some(domain) => INSTITUTIONAL_DOMAINS.contains(&domain),
        None => false,
    }
}
