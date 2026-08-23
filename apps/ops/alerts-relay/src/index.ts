// alerts-relay: a Cloudflare Worker that turns machine alerts into Slack messages.
//
// Routes:
//   GET  /health          liveness, unauthenticated
//   POST /azure?token=…   Azure Monitor Common Alert Schema  -> Slack
//   POST /generic?token=… { title, body, severity, … }       -> Slack
//
// Auth is a shared token. It is accepted in the query string as well as a bearer
// header because an Azure Monitor action group's webhook receiver can only be
// given a URI and cannot set request headers, so a header-only scheme would
// lock out the one caller this exists for.

import { formatAzureAlert, isAzureCommonAlert } from "./azure";
import { postToSlack, type Severity, type SlackMessage } from "./slack";

export interface Env {
  /**
   * Incoming webhook for the #alerts channel. Deliberately the same name as the
   * GitHub Actions secret holding the same URL: one webhook, one name, wherever
   * it is configured. The relay never posts anywhere else, so there is no
   * #deploys equivalent here.
   */
  SLACK_WEBHOOK_ALERTS: string;
  RELAY_TOKEN: string;
}

const SEVERITIES: readonly Severity[] = ["critical", "warning", "good", "info"];

/**
 * Comparison whose running time does not depend on where the strings first
 * differ. Cloudflare offers `crypto.subtle.timingSafeEqual`, but this keeps the
 * module runnable under plain Node for the tests.
 */
function secureEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function isAuthorized(request: Request, env: Env): boolean {
  // An unset secret must never mean "open to the world".
  if (!env.RELAY_TOKEN) return false;

  const header = request.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const query = new URL(request.url).searchParams.get("token") ?? "";

  return (
    (bearer !== "" && secureEquals(bearer, env.RELAY_TOKEN)) ||
    (query !== "" && secureEquals(query, env.RELAY_TOKEN))
  );
}

function isSeverity(value: unknown): value is Severity {
  return typeof value === "string" && SEVERITIES.includes(value as Severity);
}

/** Validates the `/generic` body into a SlackMessage, or returns why it cannot. */
export function parseGenericMessage(body: unknown): SlackMessage | string {
  if (typeof body !== "object" || body === null) {
    return "body must be a JSON object";
  }
  const input = body as Record<string, unknown>;

  if (typeof input.title !== "string" || input.title.trim() === "") {
    return "title is required";
  }
  if (input.severity !== undefined && !isSeverity(input.severity)) {
    return `severity must be one of ${SEVERITIES.join(", ")}`;
  }

  const fields = Array.isArray(input.fields)
    ? input.fields
        .filter(
          (field): field is { label: unknown; value: unknown } =>
            typeof field === "object" && field !== null,
        )
        .map((field) => ({
          label: String(field.label ?? ""),
          value: String(field.value ?? ""),
        }))
    : undefined;

  const link =
    typeof input.link === "object" && input.link !== null
      ? (input.link as { text?: unknown; url?: unknown })
      : undefined;

  return {
    severity: isSeverity(input.severity) ? input.severity : "info",
    title: input.title,
    body: typeof input.body === "string" ? input.body : undefined,
    fields,
    context: typeof input.context === "string" ? input.context : undefined,
    link:
      typeof link?.url === "string"
        ? { text: String(link.text ?? "Open"), url: link.url }
        : undefined,
  };
}

function json(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (request.method === "GET" && pathname === "/health") {
      return json(200, { status: "ok" });
    }

    if (request.method !== "POST") {
      return json(405, { error: "method not allowed" });
    }
    if (pathname !== "/azure" && pathname !== "/generic") {
      return json(404, { error: "not found" });
    }
    if (!isAuthorized(request, env)) {
      return json(401, { error: "unauthorized" });
    }
    if (!env.SLACK_WEBHOOK_ALERTS) {
      return json(500, { error: "SLACK_WEBHOOK_ALERTS is not configured" });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json(400, { error: "invalid JSON body" });
    }

    let message: SlackMessage;
    if (pathname === "/azure") {
      if (!isAzureCommonAlert(body)) {
        // Almost always means the action group was created without
        // `useCommonAlertSchema`, so say so rather than "bad request".
        return json(400, {
          error:
            "expected schemaId=azureMonitorCommonAlertSchema; enable the common alert schema on the action group",
        });
      }
      message = formatAzureAlert(body);
    } else {
      const parsed = parseGenericMessage(body);
      if (typeof parsed === "string") {
        return json(400, { error: parsed });
      }
      message = parsed;
    }

    try {
      await postToSlack(env.SLACK_WEBHOOK_ALERTS, message);
    } catch (error) {
      console.error("slack delivery failed", error);
      // 502, not 500: the relay worked and Slack did not. Azure Monitor retries
      // a webhook receiver on 5xx, which is the behaviour wanted here.
      return json(502, { error: "slack delivery failed" });
    }

    return json(200, { status: "sent" });
  },
};
