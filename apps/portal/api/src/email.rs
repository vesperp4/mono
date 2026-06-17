use anyhow::Context;
use async_trait::async_trait;

/// Sends transactional email. The concrete provider (Azure Communication
/// Services, Resend, …) is chosen later; handlers depend only on this trait, so
/// swapping the implementation needs no handler changes.
#[async_trait]
pub trait EmailSender: Send + Sync {
    /// Send the membership verification link to an institutional address.
    async fn send_verification(&self, to: &str, link: &str) -> anyhow::Result<()>;
}

/// Stub sender used until a real provider is wired: logs the link instead of
/// sending mail, so the whole join → verify flow is exercisable locally and in
/// dev. Replace with a concrete `AcsEmailSender` / Resend client later.
pub struct LogEmailSender;

#[async_trait]
impl EmailSender for LogEmailSender {
    async fn send_verification(&self, to: &str, link: &str) -> anyhow::Result<()> {
        tracing::info!(
            target: "email",
            to,
            link,
            "verification email (LogEmailSender — not actually sent)"
        );
        Ok(())
    }
}

/// Entra scope for the Azure Communication Services data plane.
const ACS_TOKEN_SCOPE: &str = "https://communication.azure.com/.default";

/// GA api-version of the ACS Email send REST API.
const ACS_API_VERSION: &str = "2023-03-31";

/// Sends verification mail through Azure Communication Services Email.
///
/// Authenticates passwordless: the app's user-assigned managed identity
/// (`AZURE_CLIENT_ID`) mints an Entra bearer token for the ACS data plane — the
/// same identity used for Postgres, no access key or Key Vault secret. The
/// identity needs a role on the ACS resource (see infra); without it ACS returns
/// `403` and the send fails loudly.
pub struct AcsEmailSender {
    /// ACS data-plane origin, e.g. `https://portal-prod-acs.communication.azure.com`.
    endpoint: String,
    /// Verified sender, e.g. `DoNotReply@<guid>.azurecomm.net`.
    sender_address: String,
    subject: String,
    http: reqwest::Client,
}

impl AcsEmailSender {
    pub fn new(endpoint: String, sender_address: String) -> anyhow::Result<Self> {
        let http = reqwest::Client::builder()
            .build()
            .context("building HTTP client for ACS")?;
        Ok(Self {
            endpoint: endpoint.trim_end_matches('/').to_string(),
            sender_address,
            subject: "Confirm your Vesper P4 membership".to_string(),
            http,
        })
    }

    /// Mint a short-lived ACS data-plane token via the managed identity. Fetched
    /// per send — the credential caches internally, and sends are infrequent.
    async fn access_token(&self) -> anyhow::Result<String> {
        use azure_core::credentials::TokenCredential;
        use azure_identity::{
            ManagedIdentityCredential, ManagedIdentityCredentialOptions, UserAssignedId,
        };

        let client_id = std::env::var("AZURE_CLIENT_ID").context("AZURE_CLIENT_ID must be set")?;
        let credential = ManagedIdentityCredential::new(Some(ManagedIdentityCredentialOptions {
            user_assigned_id: Some(UserAssignedId::ClientId(client_id)),
            ..Default::default()
        }))
        .map_err(|e| anyhow::anyhow!("building managed-identity credential: {e}"))?;

        let token = credential
            .get_token(&[ACS_TOKEN_SCOPE], None)
            .await
            .map_err(|e| anyhow::anyhow!("acquiring ACS access token: {e}"))?;

        Ok(token.token.secret().to_string())
    }
}

#[async_trait]
impl EmailSender for AcsEmailSender {
    async fn send_verification(&self, to: &str, link: &str) -> anyhow::Result<()> {
        let token = self.access_token().await?;
        let url = format!(
            "{}/emails:send?api-version={}",
            self.endpoint, ACS_API_VERSION
        );

        let plain_text = format!(
            "Welcome to Vesper P4!\n\n\
             Confirm your membership by opening this link:\n{link}\n\n\
             The link expires after a while; if it has, just request a new one.\n\
             If you didn't sign up, you can ignore this email."
        );
        let html = format!(
            "<p>Welcome to Vesper P4!</p>\
             <p>Confirm your membership by clicking the link below:</p>\
             <p><a href=\"{link}\">Confirm my membership</a></p>\
             <p>The link expires after a while; if it has, just request a new one. \
             If you didn't sign up, you can ignore this email.</p>"
        );

        let body = serde_json::json!({
            "senderAddress": self.sender_address,
            "recipients": { "to": [ { "address": to } ] },
            "content": {
                "subject": self.subject,
                "plainText": plain_text,
                "html": html,
            }
        });

        // Repeatability headers make a retried POST idempotent on ACS's side.
        let request_id = uuid::Uuid::new_v4().to_string();
        let first_sent = chrono::Utc::now()
            .format("%a, %d %b %Y %H:%M:%S GMT")
            .to_string();

        let resp = self
            .http
            .post(&url)
            .bearer_auth(token)
            .header("Repeatability-Request-ID", request_id)
            .header("Repeatability-First-Sent", first_sent)
            .json(&body)
            .send()
            .await
            .context("sending ACS email request")?;

        let status = resp.status();
        if !status.is_success() {
            let detail = resp.text().await.unwrap_or_default();
            anyhow::bail!("ACS email send failed ({status}): {detail}");
        }

        tracing::info!(target: "email", to, "verification email accepted by ACS");
        Ok(())
    }
}
