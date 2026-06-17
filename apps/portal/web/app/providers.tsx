"use client";

// Client-side providers wrapper. Empty for now — session/auth context will be
// added here when portal authentication (Microsoft OIDC SSO + magic-link) lands.
export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
