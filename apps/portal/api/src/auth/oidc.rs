//! Microsoft Entra ID sign-in: OIDC authorization-code flow with PKCE (S256).
//!
//! Hand-rolled against the tenant's v2.0 endpoints rather than pulling in an
//! OIDC client crate — same trade-off as the hand-rolled ACS REST calls in
//! `email.rs`: the surface we need (one authorize URL, one token POST, one
//! JWKS fetch) is small and stable, and owning it keeps the dependency tree
//! and the security-critical validation logic auditable.
//!
//! Flow, and where each moving part is checked:
//! - `begin_auth` mints `state` + `nonce` + PKCE verifier, stores their hashes
//!   (verifier in the clear — it never leaves the server) with a 10-minute
//!   expiry, and builds the authorize URL.
//! - `complete_auth` burns the `state` row (single-use, unexpired — CSRF),
//!   redeems the code with the PKCE verifier (code interception), verifies the
//!   ID token's RS256 signature against the tenant JWKS (forgery), then runs
//!   [`validate_claims`] for aud/iss/exp/tid/nonce and the institutional-email
//!   domain. Claim validation is a pure function so it is unit-testable
//!   without a network or a signing key.
//!
//! The tenant is pinned to PUPR's: `iss` and `tid` must both match, so a token
//! from any other Entra tenant — even a validly signed one — is rejected.

use std::collections::HashMap;

use anyhow::Context;
use base64::Engine;
use chrono::{Duration, Utc};
use jsonwebtoken::{Algorithm, DecodingKey, Validation};
use serde::Deserialize;
use sqlx::PgPool;
use tokio::sync::RwLock;

use crate::members::validate::validate_institutional_email;
use crate::token::{generate_token, hash_token};

/// Entra audience for managed-identity federated credential exchange: an MI
/// token for this scope is accepted as the app registration's client
/// assertion, so no client secret exists anywhere.
const FIC_TOKEN_SCOPE: &str = "api://AzureADTokenExchange/.default";

/// RFC 7523 assertion type sent alongside `client_assertion`.
const CLIENT_ASSERTION_TYPE: &str = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";

/// Lifetime of a pending authorization request. Short on purpose: the redirect
/// round-trip to Microsoft either completes within minutes or not at all.
const AUTH_REQUEST_TTL_MINUTES: i64 = 10;

/// How the app authenticates to the token endpoint when redeeming a code.
pub enum ClientCredential {
    /// A classic client secret (`OIDC_CLIENT_SECRET`) — local dev, or before
    /// the federated credential is wired in infra.
    Secret(String),
    /// Passwordless: the app's user-assigned managed identity mints a token
    /// for [`FIC_TOKEN_SCOPE`], sent as a federated client assertion. Same
    /// no-secret posture as the Postgres and ACS auth in `db.rs`/`email.rs`.
    ManagedIdentityFederated {
        /// Client id of the user-assigned managed identity (`AZURE_CLIENT_ID`).
        client_id: String,
    },
}

/// Everything needed to run the OIDC dance against one Entra app registration.
pub struct OidcConfig {
    /// Application (client) id of the Entra app registration.
    client_id: String,
    /// PUPR tenant GUID — pins `iss`/`tid` validation to this tenant.
    tenant_id: String,
    /// Redirect URI registered on the app (this API's `/auth/oidc/callback`).
    redirect_uri: String,
    credential: ClientCredential,
    http: reqwest::Client,
    /// Tenant JWKS, cached after first use. Microsoft rotates signing keys, so
    /// an unknown `kid` triggers one refetch (see `verify_signature`).
    jwks: RwLock<Option<CachedJwks>>,
}

/// Coarse sign-in failure handed to the callback handler. Deliberately a
/// single generic code: callers redirect the browser to an error page, never
/// return JSON, and nothing distinguishes "member not found" from "not
/// active" or from any protocol failure — no enumeration via error shapes.
#[derive(Debug)]
pub enum AuthFailure {
    /// Some step of the OIDC dance failed (details already logged server-side).
    OidcFailed,
}

/// Parsed tenant JWKS: `kid` → RSA `(n, e)` components as published.
struct CachedJwks {
    keys: HashMap<String, (String, String)>,
}

#[derive(Deserialize)]
struct JwksDoc {
    keys: Vec<Jwk>,
}

#[derive(Deserialize)]
struct Jwk {
    kid: Option<String>,
    kty: String,
    n: Option<String>,
    e: Option<String>,
}

#[derive(Deserialize)]
struct TokenResponse {
    id_token: String,
}

/// The ID-token claims we act on. Everything security-relevant is re-checked
/// in [`validate_claims`]; the email claims are the payload we're here for.
#[derive(Debug, Deserialize)]
struct IdTokenClaims {
    aud: String,
    iss: String,
    exp: i64,
    /// Entra tenant the account belongs to.
    tid: Option<String>,
    /// Echo of the nonce from `begin_auth`, binding token to auth request.
    nonce: Option<String>,
    /// Usually the UPN — the institutional address for PUPR accounts.
    preferred_username: Option<String>,
    /// Fallback when `preferred_username` is absent.
    email: Option<String>,
}

impl OidcConfig {
    pub fn new(
        client_id: String,
        tenant_id: String,
        redirect_uri: String,
        credential: ClientCredential,
    ) -> anyhow::Result<Self> {
        let http = reqwest::Client::builder()
            .build()
            .context("building HTTP client for OIDC")?;
        Ok(Self {
            client_id,
            tenant_id,
            redirect_uri,
            credential,
            http,
            jwks: RwLock::new(None),
        })
    }

    fn authorize_endpoint(&self) -> String {
        format!(
            "https://login.microsoftonline.com/{}/oauth2/v2.0/authorize",
            self.tenant_id
        )
    }

    fn token_endpoint(&self) -> String {
        format!(
            "https://login.microsoftonline.com/{}/oauth2/v2.0/token",
            self.tenant_id
        )
    }

    fn jwks_endpoint(&self) -> String {
        format!(
            "https://login.microsoftonline.com/{}/discovery/v2.0/keys",
            self.tenant_id
        )
    }

    /// `iss` value the tenant's v2.0 ID tokens carry.
    fn issuer(&self) -> String {
        format!("https://login.microsoftonline.com/{}/v2.0", self.tenant_id)
    }

    /// Start the dance: persist a fresh authorization request and return the
    /// Microsoft authorize URL to redirect the browser to.
    pub async fn begin_auth(&self, db: &PgPool) -> anyhow::Result<url::Url> {
        let state = generate_token();
        let nonce = generate_token();
        let pkce_verifier = generate_token();

        store_auth_request(db, &state, &nonce, &pkce_verifier)
            .await
            .context("storing OIDC authorization request")?;

        // S256: code_challenge = BASE64URL-nopad(SHA256(verifier)).
        let code_challenge =
            base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(hash_token(&pkce_verifier));

        let mut url = url::Url::parse(&self.authorize_endpoint())
            .context("parsing the authorize endpoint URL")?;
        url.query_pairs_mut()
            .append_pair("client_id", &self.client_id)
            .append_pair("response_type", "code")
            .append_pair("redirect_uri", &self.redirect_uri)
            .append_pair("response_mode", "query")
            .append_pair("scope", "openid profile email")
            .append_pair("state", &state)
            .append_pair("nonce", &nonce)
            .append_pair("code_challenge", &code_challenge)
            .append_pair("code_challenge_method", "S256");

        Ok(url)
    }

    /// Finish the dance: redeem the authorization code, verify the ID token,
    /// and return the normalized institutional email it asserts. All failure
    /// detail is logged here and collapsed into [`AuthFailure::OidcFailed`].
    pub async fn complete_auth(
        &self,
        db: &PgPool,
        code: &str,
        state: &str,
    ) -> Result<String, AuthFailure> {
        match self.complete_auth_inner(db, code, state).await {
            Ok(email) => Ok(email),
            Err(err) => {
                tracing::warn!(error = %err, "OIDC sign-in failed");
                Err(AuthFailure::OidcFailed)
            }
        }
    }

    async fn complete_auth_inner(
        &self,
        db: &PgPool,
        code: &str,
        state: &str,
    ) -> anyhow::Result<String> {
        let (nonce_hash, pkce_verifier) = consume_auth_request(db, state)
            .await
            .context("consuming OIDC authorization request")?
            .context("unknown, expired, or already-used OIDC state")?;

        let id_token = self.redeem_code(code, &pkce_verifier).await?;
        let claims = self.verify_signature(&id_token).await?;

        validate_claims(
            &claims,
            &self.client_id,
            &self.issuer(),
            &self.tenant_id,
            &nonce_hash,
            Utc::now().timestamp(),
        )
        .map_err(|reason| anyhow::anyhow!("ID-token claim validation failed: {reason}"))
    }

    /// Exchange the authorization code (+ PKCE verifier + client credential)
    /// for an ID token at the tenant token endpoint.
    async fn redeem_code(&self, code: &str, pkce_verifier: &str) -> anyhow::Result<String> {
        let mut form: Vec<(&str, String)> = vec![
            ("client_id", self.client_id.clone()),
            ("grant_type", "authorization_code".to_string()),
            ("code", code.to_string()),
            ("redirect_uri", self.redirect_uri.clone()),
            ("code_verifier", pkce_verifier.to_string()),
        ];
        match &self.credential {
            ClientCredential::Secret(secret) => {
                form.push(("client_secret", secret.clone()));
            }
            ClientCredential::ManagedIdentityFederated { client_id } => {
                let assertion = federated_assertion(client_id).await?;
                form.push(("client_assertion_type", CLIENT_ASSERTION_TYPE.to_string()));
                form.push(("client_assertion", assertion));
            }
        }

        let resp = self
            .http
            .post(self.token_endpoint())
            .form(&form)
            .send()
            .await
            .context("sending token request to Entra")?;

        let status = resp.status();
        if !status.is_success() {
            let detail = resp.text().await.unwrap_or_default();
            anyhow::bail!("Entra token endpoint returned {status}: {detail}");
        }

        let body: TokenResponse = resp.json().await.context("parsing token response")?;
        Ok(body.id_token)
    }

    /// Verify the ID token's RS256 signature against the tenant JWKS and
    /// return its claims. Claim *values* are checked by [`validate_claims`];
    /// this only establishes that Microsoft signed them.
    async fn verify_signature(&self, id_token: &str) -> anyhow::Result<IdTokenClaims> {
        let header = jsonwebtoken::decode_header(id_token).context("decoding ID-token header")?;
        anyhow::ensure!(
            header.alg == Algorithm::RS256,
            "unexpected ID-token alg {:?}",
            header.alg
        );
        let kid = header.kid.context("ID token carries no kid")?;

        // Cached JWKS first; on a miss refetch exactly once — Microsoft
        // rotates signing keys, so an unknown kid usually means a stale cache.
        let (n, e) = match self.cached_key(&kid).await {
            Some(components) => components,
            None => {
                self.refresh_jwks().await?;
                self.cached_key(&kid)
                    .await
                    .context("ID-token kid not present in the tenant JWKS")?
            }
        };
        let key = DecodingKey::from_rsa_components(&n, &e)
            .context("building RSA key from JWKS components")?;

        let mut validation = Validation::new(Algorithm::RS256);
        // aud/iss/exp/tid/nonce are all enforced in `validate_claims`, which is
        // kept pure so it can be unit-tested; here we only need the signature.
        validation.validate_aud = false;
        validation.validate_exp = false;
        validation.required_spec_claims.clear();

        let data = jsonwebtoken::decode::<IdTokenClaims>(id_token, &key, &validation)
            .context("verifying ID-token signature")?;
        Ok(data.claims)
    }

    async fn cached_key(&self, kid: &str) -> Option<(String, String)> {
        let guard = self.jwks.read().await;
        guard.as_ref()?.keys.get(kid).cloned()
    }

    async fn refresh_jwks(&self) -> anyhow::Result<()> {
        let resp = self
            .http
            .get(self.jwks_endpoint())
            .send()
            .await
            .context("fetching tenant JWKS")?;

        let status = resp.status();
        if !status.is_success() {
            anyhow::bail!("JWKS endpoint returned {status}");
        }

        let doc: JwksDoc = resp.json().await.context("parsing JWKS document")?;
        let keys = doc
            .keys
            .into_iter()
            .filter(|k| k.kty == "RSA")
            .filter_map(|k| Some((k.kid?, (k.n?, k.e?))))
            .collect();

        *self.jwks.write().await = Some(CachedJwks { keys });
        Ok(())
    }
}

/// Persist a new authorization request (hashes of `state`/`nonce`, the PKCE
/// verifier, a 10-minute expiry). Public rather than private to `begin_auth`
/// so the integration tests can exercise the single-use/expiry machinery
/// without a network round-trip to Entra.
pub async fn store_auth_request(
    db: &PgPool,
    state: &str,
    nonce: &str,
    pkce_verifier: &str,
) -> Result<(), sqlx::Error> {
    let state_hash = hash_token(state);
    let nonce_hash = hash_token(nonce);
    let expires_at = Utc::now() + Duration::minutes(AUTH_REQUEST_TTL_MINUTES);

    sqlx::query(
        "INSERT INTO oidc_auth_requests (state_hash, nonce_hash, pkce_verifier, expires_at)
         VALUES ($1, $2, $3, $4)",
    )
    .bind(&state_hash[..])
    .bind(&nonce_hash[..])
    .bind(pkce_verifier)
    .bind(expires_at)
    .execute(db)
    .await?;

    Ok(())
}

/// Consume an authorization request by its raw `state`: if it is unknown,
/// used, or expired, return `None`; otherwise mark it consumed and return the
/// stored `(nonce_hash, pkce_verifier)`. A single UPDATE, so it is atomic —
/// replaying a callback URL cannot redeem the same request twice.
pub async fn consume_auth_request(
    db: &PgPool,
    state: &str,
) -> Result<Option<(Vec<u8>, String)>, sqlx::Error> {
    let state_hash = hash_token(state);

    sqlx::query_as::<_, (Vec<u8>, String)>(
        "UPDATE oidc_auth_requests
            SET consumed_at = now()
          WHERE state_hash = $1
            AND consumed_at IS NULL
            AND expires_at > now()
        RETURNING nonce_hash, pkce_verifier",
    )
    .bind(&state_hash[..])
    .fetch_optional(db)
    .await
}

/// Mint a managed-identity token for [`FIC_TOKEN_SCOPE`] to use as the app's
/// federated client assertion. Same credential pattern as `db.rs`/`email.rs`.
async fn federated_assertion(mi_client_id: &str) -> anyhow::Result<String> {
    use azure_core::credentials::TokenCredential;
    use azure_identity::{
        ManagedIdentityCredential, ManagedIdentityCredentialOptions, UserAssignedId,
    };

    let credential = ManagedIdentityCredential::new(Some(ManagedIdentityCredentialOptions {
        user_assigned_id: Some(UserAssignedId::ClientId(mi_client_id.to_string())),
        ..Default::default()
    }))
    .map_err(|e| anyhow::anyhow!("building managed-identity credential: {e}"))?;

    let token = credential
        .get_token(&[FIC_TOKEN_SCOPE], None)
        .await
        .map_err(|e| anyhow::anyhow!("acquiring federated-credential token: {e}"))?;

    Ok(token.token.secret().to_string())
}

/// Validate the (signature-verified) claims against what this deployment and
/// this specific auth request expect, returning the normalized institutional
/// email. Pure — everything variable comes in as an argument — so the unit
/// tests below cover every rejection path without a network or a signing key.
fn validate_claims(
    claims: &IdTokenClaims,
    client_id: &str,
    issuer: &str,
    tenant_id: &str,
    nonce_hash: &[u8],
    now_unix: i64,
) -> Result<String, &'static str> {
    if claims.aud != client_id {
        return Err("aud does not match the client id");
    }
    if claims.iss != issuer {
        return Err("iss does not match the tenant issuer");
    }
    if claims.exp <= now_unix {
        return Err("ID token is expired");
    }
    if claims.tid.as_deref() != Some(tenant_id) {
        return Err("tid does not match the PUPR tenant");
    }

    let nonce = claims.nonce.as_deref().ok_or("ID token carries no nonce")?;
    if hash_token(nonce)[..] != *nonce_hash {
        return Err("nonce does not match this auth request");
    }

    // The account's sign-in address. `preferred_username` is the UPN — the
    // institutional address for PUPR accounts; `email` is the fallback.
    let raw_email = claims
        .preferred_username
        .as_deref()
        .or(claims.email.as_deref())
        .ok_or("ID token carries no email claim")?;

    // Reuses the members-flow check: trims, lowercases, and requires a PUPR
    // institutional domain. A guest/personal Microsoft account in the tenant
    // must not be able to sign in.
    validate_institutional_email(raw_email)
        .map_err(|_| "email claim is not an institutional address")
}

#[cfg(test)]
mod tests {
    use super::*;

    const CLIENT_ID: &str = "11111111-1111-1111-1111-111111111111";
    const TENANT_ID: &str = "22222222-2222-2222-2222-222222222222";
    const NONCE: &str = "test-nonce";
    const NOW: i64 = 1_750_000_000;

    fn issuer() -> String {
        format!("https://login.microsoftonline.com/{TENANT_ID}/v2.0")
    }

    fn claims() -> IdTokenClaims {
        IdTokenClaims {
            aud: CLIENT_ID.to_string(),
            iss: issuer(),
            exp: NOW + 3600,
            tid: Some(TENANT_ID.to_string()),
            nonce: Some(NONCE.to_string()),
            preferred_username: Some("Jane.Doe@students.pupr.edu".to_string()),
            email: None,
        }
    }

    fn validate(claims: &IdTokenClaims) -> Result<String, &'static str> {
        let nonce_hash = hash_token(NONCE);
        validate_claims(claims, CLIENT_ID, &issuer(), TENANT_ID, &nonce_hash, NOW)
    }

    #[test]
    fn happy_path_returns_lowercased_email() {
        assert_eq!(
            validate(&claims()).expect("valid claims"),
            "jane.doe@students.pupr.edu"
        );
    }

    #[test]
    fn falls_back_to_email_claim() {
        let mut c = claims();
        c.preferred_username = None;
        c.email = Some("jane.doe@pupr.edu".to_string());
        assert_eq!(validate(&c).expect("valid claims"), "jane.doe@pupr.edu");
    }

    #[test]
    fn rejects_wrong_aud() {
        let mut c = claims();
        c.aud = "some-other-app".to_string();
        assert!(validate(&c).is_err());
    }

    #[test]
    fn rejects_wrong_iss() {
        let mut c = claims();
        c.iss = "https://login.microsoftonline.com/other-tenant/v2.0".to_string();
        assert!(validate(&c).is_err());
    }

    #[test]
    fn rejects_wrong_tid() {
        let mut c = claims();
        c.tid = Some("33333333-3333-3333-3333-333333333333".to_string());
        assert!(validate(&c).is_err());
    }

    #[test]
    fn rejects_expired_token() {
        let mut c = claims();
        c.exp = NOW - 1;
        assert!(validate(&c).is_err());
    }

    #[test]
    fn rejects_nonce_mismatch() {
        let mut c = claims();
        c.nonce = Some("a-different-nonce".to_string());
        assert!(validate(&c).is_err());
    }

    #[test]
    fn rejects_missing_nonce() {
        let mut c = claims();
        c.nonce = None;
        assert!(validate(&c).is_err());
    }

    #[test]
    fn rejects_non_institutional_domain() {
        let mut c = claims();
        c.preferred_username = Some("jane.doe@gmail.com".to_string());
        assert!(validate(&c).is_err());
    }
}
