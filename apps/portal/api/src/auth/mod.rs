//! Sign-in (issue #171): magic-link email sign-in, Microsoft OIDC, and the
//! server-side sessions both flows mint on success.
//!
//! - `session`  — mint/validate/revoke sessions + the session cookie. THE
//!   session module: member-facing endpoints (#172) build only on this.
//! - `magic`    — one-time email login tokens.
//! - `oidc`     — Microsoft Entra ID authorization-code + PKCE flow.
//! - `handlers` — the `/api/v1/auth/*` HTTP handlers.
//!
//! Two invariants hold everywhere in this module:
//! - **Sign-in never creates members.** Only the join flow (`members`) inserts
//!   rows; sign-in merely proves control of an address that already belongs to
//!   an *active* member.
//! - **No account enumeration.** Responses and redirects are identical whether
//!   an address is unknown, pending, or active — nothing here can be used to
//!   probe who is registered.

pub mod handlers;
pub mod magic;
pub mod oidc;
pub mod session;
