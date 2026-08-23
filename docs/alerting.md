# Alerting

How machine signals reach a human, and why the pieces are arranged this way.

## Why this exists

On 2026-08-19 a member reported that portal signup did not work. Every
observable thing was healthy: `/signin`, `/signup` and `/confirm` returned 200,
`api.portal.vesperp4.com/health` returned `{"database":"up","status":"ok"}`,
CORS and TLS were correct, and prod had been unchanged since July. The triage
took hours and none of those probes carried any information about the problem.

The reason is structural and deliberate. Transactional mail is sent
fire-and-forget behind a fixed `202`, which is what closes the
account-enumeration oracle. The operational cost is that **a completely broken
mail path is externally indistinguishable from a healthy API**. On top of that,
the ACS resource had no diagnostic settings at all, so "was this message
delivered" was unanswerable after the fact.

Alerting here is the other half of that fix. The rule that follows from it:

> **Any triage of the portal mail path starts at ACS delivery logs, never at
> HTTP status codes.**

## Channels

| Channel | Carries | Read it |
|---|---|---|
| `#alerts` | Failures on `main`, prod Azure alerts, uptime probe failures | When it pings |
| `#deploys` | Successful deploys, prod promotions, releases | Skim |
| `#content` | Sanity publishes (optional; overlaps with `#deploys`) | Skim |

One alerts channel, not one per subsystem. A chapter this size splitting alerts
across five channels gets five channels nobody reads.

## Routes

| Source | Path to Slack | Channel |
|---|---|---|
| GitHub Actions failures on `main` | `.github/workflows/slack-notify.yaml` builds Slack JSON and `curl`s a webhook | `#alerts` |
| Deploys, promotions, releases | same workflow, success branch | `#deploys` |
| Prod reachability | `.github/workflows/uptime-check.yaml`, every 30 min | `#alerts` |
| Azure Monitor alert rules | action group webhook to the **alerts-relay** Worker, which translates | `#alerts` |
| Sanity publish | Sanity webhook with a GROQ projection that emits Slack JSON directly | `#content` |

Only Azure needs the relay. Azure Monitor has no Slack receiver: its webhook
receiver POSTs Azure's own JSON and a Slack Incoming Webhook accepts only
Slack's, so something has to translate. That something is
`apps/ops/alerts-relay`, a Cloudflare Worker on the free tier. GitHub and Sanity
can both produce Slack's shape themselves, so they go direct; routing them
through the relay would only add a way for alerts to go missing.

### What GitHub notifies on

Watched workflows are listed in `slack-notify.yaml`. The `workflow_run` trigger
carries a `branches: [main]` filter, so PR failures stay in the PR where they
are already visible. Successes are announced only for the workflows that change
what is deployed. `cancelled` and `skipped` are ignored.

Adding coverage for a new workflow is one line in that watch list.

### What Azure notifies on

Defined in the infra repo, `bicep/modules/app-alerts.bicep`:

| Rule | Severity | Why it exists |
|---|---|---|
| `*-email-send-failed` | Sev1 | The API already logged `verification email send failed` and nobody was listening. Signup is silently broken when this fires. |
| `*-oidc-callback-error` | Sev2 | Entra returned `access_denied` and `interaction_required` on consecutive days in August 2026 and it took a triage to notice. PUPR owns that tenant. |
| `*-delivery-failed` | Sev1 | ACS's own verdict on delivery, which the app cannot give because the send is fire-and-forget. Disabled until its query is confirmed against a workspace with rows. |

Enabling ACS diagnostic settings is part of the same module and is on by
default. It is the single change that would have turned that multi-hour triage
into a lookup.

### What is deliberately not alerted

- **PR-level CI failures.** Visible in the PR.
- **Dependabot and Renovate noise.** GitHub already emails and lists these.
- **Dev environment.** Dev breaking is normal and is not a page. Add `dev` to
  the `branches:` filter in `slack-notify.yaml` if that changes.
- **Cost.** Azure budget alerts are worth adding later; they are not wired yet.

## Setup

Ordered, because later steps depend on earlier ones.

1. **Slack app and webhooks.** Create one Slack app for the workspace, enable
   Incoming Webhooks, and add one webhook per channel (`#alerts`, `#deploys`,
   and `#content` if used). One app covers all of them, which matters on the
   free plan's 10-app limit.

2. **GitHub secrets** on `vesperp4/mono`:

   | Secret | Value |
   |---|---|
   | `SLACK_WEBHOOK_ALERTS` | `#alerts` incoming webhook URL |
   | `SLACK_WEBHOOK_DEPLOYS` | `#deploys` incoming webhook URL |

   Both are optional in the sense that the workflows warn and exit 0 rather than
   fail when they are absent, and deploy announcements fall back to the alerts
   webhook if only that one is set.

3. **Deploy the relay.** See `apps/ops/alerts-relay/README.md`. Needs a
   `cloudflare` GitHub environment holding `CLOUDFLARE_API_TOKEN` and
   `CLOUDFLARE_ACCOUNT_ID` for CI redeploys.

4. **Store the relay URL in Key Vault** as `alerts-relay-url` in each env's
   vault, including the `?token=` query string. That whole URL is a credential.

5. **Turn Azure alerting on**, in the infra repo, two phases:
   - uncomment `alertsRelayUrl` in `platform/<env>.bicepparam` and deploy the
     platform, which creates the action group and nothing else;
   - set `alertsActionGroupName = 'vesperp4-<env>-ag'` in each app's
     `.bicepparam`, which creates that app's rules.

   Commenting the first one back out is the kill switch for all of it.

6. **Confirm the ACS delivery query**, once diagnostics have produced rows:

   ```kusto
   ACSEmailStatusUpdateOperational | take 10
   ```

   Then set `acsDeliveryAlertEnabled = true`. It is off by default because Azure
   validates alert queries at deploy time, so referencing a table that does not
   exist yet fails the deployment.

### Optional: Sanity publish to Slack

Sanity webhooks let you shape the request body with a GROQ projection, so they
can emit Slack's format with no code in between. In the Sanity console, under
**API → Webhooks**, point the URL at the `#content` incoming webhook with:

- **Trigger on**: create, update
- **Filter**: `_type in ["post", "event"]`
- **Projection**:

  ```groq
  {"text": "Published " + _type + ": " + coalesce(title, name, "(untitled)")}
  ```

- **HTTP method**: POST, **Content-Type**: `application/json`

This overlaps with the `mainsite-web Deploy` success message in `#deploys`,
since a publish triggers a redeploy anyway. Skip it unless the editorial team
wants their own channel.

## Verifying the whole path

```bash
# 1. The relay itself
curl -sS -X POST "https://vesperp4-alerts-relay.<subdomain>.workers.dev/generic?token=$RELAY_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"title":"Relay smoke test","severity":"good"}'

# 2. The GitHub path
gh workflow run uptime-check.yaml --repo vesperp4/mono
```

For the Azure path, use the **Test** button on the action group in the portal.
It sends a real Common Alert Schema payload, which exercises the translation
rather than just the transport.

## Known limits

- **The uptime check is shallow.** It answers "reachable, and does the API claim
  its database is up". It cannot see the mail failure class described above, and
  it has no state, so a sustained outage posts every 30 minutes rather than once.
- **Scheduled workflows are best-effort.** GitHub delays and eventually disables
  cron workflows on quiet repos. This one is not a substitute for real uptime
  monitoring if the TV channel ever needs a hard SLA.
- **The relay is a single point of failure for Azure alerts.** It is a static
  Worker with no dependencies, but if Cloudflare is down, Azure alerts do not
  arrive. They are still in the Azure portal.
