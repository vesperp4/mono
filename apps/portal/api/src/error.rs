use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::json;

/// Application error, rendered as a small JSON envelope:
/// `{ "error": { "code": "...", "message": "..." } }`.
#[derive(Debug)]
pub enum AppError {
    /// Caller input failed validation (400).
    Validation(String),
    /// Verification token unknown, already used, or expired (410).
    InvalidToken,
    /// Anything unexpected (DB, email, …) — logged, surfaced as a generic 500.
    Internal(anyhow::Error),
}

impl AppError {
    fn parts(&self) -> (StatusCode, &'static str, String) {
        match self {
            AppError::Validation(msg) => (StatusCode::BAD_REQUEST, "validation_error", msg.clone()),
            AppError::InvalidToken => (
                StatusCode::GONE,
                "invalid_token",
                "This confirmation link is invalid or has expired. Request a new one.".to_string(),
            ),
            AppError::Internal(_) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                "internal_error",
                "Something went wrong. Please try again.".to_string(),
            ),
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        // Log the underlying cause for 500s; never leak it to the caller.
        if let AppError::Internal(ref err) = self {
            tracing::error!(error = %err, "internal error");
        }
        let (status, code, message) = self.parts();
        (
            status,
            Json(json!({ "error": { "code": code, "message": message } })),
        )
            .into_response()
    }
}

impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::Internal(err)
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError::Internal(err.into())
    }
}
