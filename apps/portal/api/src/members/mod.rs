//! Members directory: the email-verified join flow.
//!
//! - `model`    — request/response types and domain constants.
//! - `validate` — input validation + normalization (PUPR domains, departments).
//! - `repo`     — sqlx queries, token issue/consume.
//! - `handlers` — the `/api/v1/members*` HTTP handlers.

pub mod handlers;
pub mod model;
pub mod repo;
pub mod validate;
