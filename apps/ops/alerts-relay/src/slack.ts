// Slack Incoming Webhook client + the small subset of Block Kit this relay emits.
//
// Colour lives on an *attachment*, not on blocks: Block Kit has no colour field,
// so the familiar coloured bar down the left of an alert is only reachable by
// wrapping the blocks in a single attachment.

export type Severity = "critical" | "warning" | "good" | "info";

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: "#d7263d",
  warning: "#f0a202",
  good: "#2eb886",
  info: "#5b6a7d",
};

const SEVERITY_EMOJI: Record<Severity, string> = {
  critical: ":rotating_light:",
  warning: ":warning:",
  good: ":white_check_mark:",
  info: ":information_source:",
};

export interface SlackMessage {
  severity: Severity;
  title: string;
  /** Free-form body, rendered as mrkdwn. Optional. */
  body?: string;
  /** Rendered as a two-column field grid under the body. */
  fields?: Array<{ label: string; value: string }>;
  /** Small muted line at the bottom: resource ids, run numbers, timestamps. */
  context?: string;
  /** Adds a single link button when both are present. */
  link?: { text: string; url: string };
}

interface SlackBlock {
  type: string;
  [key: string]: unknown;
}

/** Slack truncates hard and errors on oversized blocks; clamp before it does. */
function clamp(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

export function buildPayload(message: SlackMessage): unknown {
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: clamp(
          `${SEVERITY_EMOJI[message.severity]} ${message.title}`,
          150,
        ),
        emoji: true,
      },
    },
  ];

  if (message.body) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: clamp(message.body, 3000) },
    });
  }

  if (message.fields?.length) {
    // Block Kit caps a section at 10 fields; anything past that is dropped by
    // Slack with a 400, so split into successive sections instead.
    for (let i = 0; i < message.fields.length; i += 10) {
      blocks.push({
        type: "section",
        fields: message.fields.slice(i, i + 10).map((field) => ({
          type: "mrkdwn",
          // Concatenation, not a template literal. esbuild rewrites a
          // backslash-n escape inside a template literal into a real newline,
          // which splits the built bundle across lines and leaves a string that
          // any editor auto-indenting on paste will silently corrupt. Inside a
          // normal double-quoted string the escape survives the build intact.
          text: clamp("*" + field.label + "*\n" + field.value, 2000),
        })),
      });
    }
  }

  if (message.link) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: message.link.text, emoji: true },
          url: message.link.url,
        },
      ],
    });
  }

  if (message.context) {
    blocks.push({
      type: "context",
      elements: [{ type: "mrkdwn", text: clamp(message.context, 3000) }],
    });
  }

  return {
    // `text` is the notification preview and the accessibility fallback. Slack
    // shows an empty push notification without it, however many blocks there are.
    text: clamp(message.title, 3000),
    attachments: [{ color: SEVERITY_COLOR[message.severity], blocks }],
  };
}

export async function postToSlack(
  webhookUrl: string,
  message: SlackMessage,
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(buildPayload(message)),
  });

  if (!response.ok) {
    // Slack returns the reason as plain text ("invalid_payload", "no_service"),
    // never JSON, so surface the body verbatim in the Worker log.
    throw new Error(
      `Slack webhook returned ${response.status}: ${await response.text()}`,
    );
  }
}
