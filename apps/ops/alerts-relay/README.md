# alerts-relay

A Cloudflare Worker that turns machine alerts into Slack messages.

It exists for one reason: **Azure Monitor action groups have no Slack receiver.**
Their `webhook` receiver POSTs Azure's own JSON, and a Slack Incoming Webhook
only accepts Slack's. Something has to translate, and a Worker is the cheapest
place to put it: free tier, no Azure resource, no VM, no always-on anything.

GitHub Actions and Sanity do **not** go through here. Actions builds Slack JSON
directly in `.github/workflows/slack-notify.yaml`, and Sanity webhooks can
project their payload into Slack's shape in the Sanity console. Adding a hop
would only add a way for alerts to go missing.

## Routes

| Method | Path       | Body                                | Purpose |
|--------|------------|-------------------------------------|---------|
| `GET`  | `/health`  | none                                | Liveness. No auth. |
| `POST` | `/azure`   | Azure Monitor Common Alert Schema   | The action group target. |
| `POST` | `/generic` | `{title, body?, severity?, fields?, context?, link?}` | Anything else that wants a formatted Slack message. |

`severity` is one of `critical`, `warning`, `good`, `info` and picks the colour
and icon. For `/azure` it is derived: Sev0/Sev1 → critical, Sev2 → warning,
Sev3/Sev4 → info, and any **resolved** alert → good regardless of severity.

## Auth

A shared token, accepted either as `Authorization: Bearer <token>` or as
`?token=<token>`.

The query-string form is not laziness. An Azure Monitor action group's webhook
receiver takes a **URI and nothing else** (it cannot set request headers), so a
header-only scheme would lock out the one caller this was built for. Treat the
whole action-group URL as a secret; it is stored in Key Vault, not in git.

An unset `RELAY_TOKEN` rejects everything rather than falling open.

## Setup

### Deploying from the dashboard, with no CLI and no token

Perfectly valid, and the fastest way to a working relay. UI labels below were
checked against the Cloudflare docs on 2026-08-23; the dashboard moves, so trust
the screen over this file if they disagree.

```bash
pnpm --filter alerts-relay bundle
```

That writes `dist/index.js`, a single self-contained file with all three modules
inlined and no imports. `dist/` is gitignored, so it is build output, not source.

The step also runs `scripts/check-bundle.sh`, which fails the build if any string
in the output spans a line break. That is not cosmetic. esbuild rewrites a
backslash-n escape inside a template literal into a real newline, and `--minify`
rewrites a plain `"\n"` string back into a template literal because it saves a
byte. Either way the bundle ends up with a string broken across two lines, and an
editor that reindents on paste corrupts it into a syntax error a long way from
the actual damage. Keep separators as double-quoted escapes, and do not minify
the file you intend to paste.

1. Cloudflare dashboard, **Workers & Pages**, then **Create application**.
2. Pick the most minimal template in the gallery. Every line of it is about to be
   replaced, so the only thing that matters is that it is a plain Worker with no
   static assets or extra bindings attached.
3. **Name it exactly `vesperp4-alerts-relay`**, matching `name` in
   `wrangler.toml`. This is the step worth slowing down for: a different name
   means a later CLI or CI deploy publishes a *second* Worker rather than
   updating this one, while Azure keeps calling the first. The name also becomes
   the URL, `vesperp4-alerts-relay.<your-subdomain>.workers.dev`.
4. Deploy the template, then open **Edit Code** on the Worker. That editor is
   VS Code for the Web and handles multi-module Workers, but the bundle is a
   single file so it needs none of that. Select all, paste `dist/index.js` over
   it, and deploy.
5. **Settings -> Variables and Secrets -> Add.** Set type to **Secret** for both:
   `SLACK_WEBHOOK_ALERTS` (the `#alerts` incoming webhook) and `RELAY_TOKEN`
   (`openssl rand -hex 32`). Then **Deploy**, which applies them immediately;
   there is no separate redeploy. Keep `RELAY_TOKEN` somewhere safe, because Key
   Vault needs the same value later and Cloudflare will not show it again.
6. Visit `https://vesperp4-alerts-relay.<your-subdomain>.workers.dev/health`.
   `{"status":"ok"}` means it is live.

No compatibility date step is needed. A Worker created through the dashboard is
assigned the current date automatically, which is newer than the `2026-08-01` in
`wrangler.toml`.

`workers_dev = true` in `wrangler.toml` is deliberate and must stay. Disabling
the workers.dev route in the dashboard without also changing that line only lasts
until the next CLI deploy, which silently re-enables it.

Regenerate the bundle and repaste whenever `src/` changes. If that becomes
tedious, that is the moment to add the API token and let
`.github/workflows/alerts-relay-deploy.yaml` do it. Until the token exists that
workflow warns and skips rather than failing the build.

### Authenticating the CLI

Only needed if you would rather not paste into the dashboard, or once you want
CI to deploy for you.

**In the devpod, do not run `wrangler login`.** It starts a browser OAuth flow
and blocks waiting for a callback on `localhost:8976`. The container has no
browser, and `.devcontainer/devcontainer.json` forwards only 3000 and 8080, so
the callback has nowhere to land and the command hangs until you kill it.

Use a scoped API token instead. It works headlessly, and it is the same
credential CI needs, so this is one step rather than two.

1. Cloudflare dashboard, **My Profile -> API Tokens -> Create Token**, and use
   the **Edit Cloudflare Workers** template. It grants exactly what
   `wrangler deploy` and `wrangler secret put` require, and nothing else.
2. Note the **Account ID** from the dashboard sidebar. Not a secret, but keep it
   out of this repo, which is public.
3. Put the token in a file outside the repo, mode 600, so it never reaches git
   or your shell history:

   ```bash
   install -m 600 /dev/null ~/.cloudflare-token
   cat > ~/.cloudflare-token        # paste the token, then Ctrl-D
   ```

4. Load it in any shell that runs wrangler:

   ```bash
   export CLOUDFLARE_API_TOKEN="$(cat ~/.cloudflare-token)"
   export CLOUDFLARE_ACCOUNT_ID="<account id>"
   ```

Verify before going further:

```bash
pnpm --filter alerts-relay exec wrangler whoami
```

On a laptop with a browser, `wrangler login` is still fine and skips all of the
above.

### Deploying from the CLI

```bash
# Publish first: `wrangler secret put` writes to a Worker that must already exist.
pnpm --filter alerts-relay exec wrangler deploy

# Secrets live in Cloudflare, not in git, and survive redeploys.
pnpm --filter alerts-relay exec wrangler secret put SLACK_WEBHOOK_ALERTS
pnpm --filter alerts-relay exec wrangler secret put RELAY_TOKEN   # openssl rand -hex 32
```

Order matters. `wrangler secret put` against a Worker that has never been
deployed fails with a 10007 "workers.api.error.script_not_found", which reads
like a permissions problem and is not one. Deploy once, then set the secrets,
then the next deploy picks them up. The first deploy will answer 500 on
`/azure` until both secrets exist, which is correct behaviour, not a broken
deploy.

The deployed URL is `https://vesperp4-alerts-relay.<subdomain>.workers.dev`.
Put `<that URL>/azure?token=<RELAY_TOKEN>` into the env Key Vault as
`alerts-relay-url`; the infra repo reads it from there into the action group
(`bicep/modules/alerts.bicep`).

CI redeploys on every push to `main` that touches this directory
(`.github/workflows/alerts-relay-deploy.yaml`), using the `cloudflare`
environment's `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

## Local development

```bash
cp .dev.vars.example .dev.vars      # gitignored
pnpm --filter alerts-relay dev
```

`.dev.vars` can point `SLACK_WEBHOOK_ALERTS` at a throwaway channel's webhook while
you iterate on formatting.

## Checking it end to end

```bash
curl -sS -X POST "https://vesperp4-alerts-relay.<subdomain>.workers.dev/generic?token=$RELAY_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"title":"Relay smoke test","severity":"good","body":"If you can read this in Slack, the relay works."}'
```

Azure's own **Test** button on the action group sends a Common Alert Schema
sample, which is the better test of the real path.

## Tests

```bash
pnpm --filter alerts-relay test
```

Plain Vitest against the exported `fetch` handler with a stubbed global `fetch`.
No Workers test pool, because everything interesting here is pure translation.
