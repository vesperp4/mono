//! Random-token generation and hashing, shared by the members verification
//! flow and the sign-in flows (magic links, sessions, OIDC state).
//!
//! The discipline is always the same: the raw token leaves the server exactly
//! once (in an email link, a cookie, or a redirect URL) and only its SHA-256
//! is ever persisted or looked up, so a database leak exposes nothing usable.

use sha2::{Digest, Sha256};

/// A 256-bit random token, hex-encoded (64 URL-safe chars).
pub(crate) fn generate_token() -> String {
    use rand::RngCore;
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);
    hex::encode(bytes)
}

/// SHA-256 of the raw token — what we store and look up by.
pub(crate) fn hash_token(token: &str) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(token.as_bytes());
    hasher.finalize().into()
}
