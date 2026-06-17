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
