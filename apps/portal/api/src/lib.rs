//! Vesper P4 backend API — library root.
//!
//! Modules live here (rather than in `main.rs`) so the binary and the
//! integration tests can both depend on them. `main.rs` is a thin bootstrap.

pub mod auth;
pub mod db;
pub mod email;
pub mod error;
pub mod members;
pub mod rate_limit;
pub mod router;
pub mod state;
pub mod token;
