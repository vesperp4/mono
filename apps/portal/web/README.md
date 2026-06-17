# portal-web

The **member portal** for VESPER P4 — `portal.vesperp4.com` (dev: `portal.dev.vesperp4.com`).

This Next.js app owns the authenticated/member surface: **sign up**, **sign in**, and
email **confirmation**. The public marketing content lives in the separate `mainsite-web`
app (`vesperp4.com`), which links here for joining.

## Surfaces

| Route       | Purpose                                                              |
|-------------|---------------------------------------------------------------------|
| `/`         | Portal home — entry points to sign in / sign up.                     |
| `/signup`   | Membership application (join form) → `POST /api/v1/members`.         |
| `/signin`   | Member sign in. **Placeholder** — Microsoft OIDC SSO + magic-link.   |
| `/confirm`  | Email-verification landing → `POST /api/v1/members/confirm`.         |

## Configuration

Set `NEXT_PUBLIC_API_URL` to the `portal-api` base URL (see `.env.example`). Locally it
defaults to `http://localhost:8080`.

## Getting Started

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).
