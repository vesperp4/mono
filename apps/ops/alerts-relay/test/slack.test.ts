import { describe, expect, it } from "vitest";

import { buildPayload, type SlackMessage } from "../src/slack";

interface Block {
  type: string;
  fields?: unknown[];
  text?: { text: string };
}

interface Payload {
  text: string;
  attachments: Array<{ color: string; blocks: Block[] }>;
}

/** `noUncheckedIndexedAccess` is on, so index access is narrowed explicitly. */
function expectDefined<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`expected ${what}`);
  return value;
}

function attachment(message: SlackMessage) {
  const payload = buildPayload(message) as Payload;
  return expectDefined(payload.attachments[0], "an attachment");
}

describe("buildPayload", () => {
  it("always sets top-level text so the push notification is not blank", () => {
    const payload = buildPayload({
      severity: "info",
      title: "Deploy finished",
    }) as Payload;
    expect(payload.text).toBe("Deploy finished");
  });

  it("colours the attachment by severity", () => {
    expect(attachment({ severity: "critical", title: "x" }).color).toBe(
      "#d7263d",
    );
    expect(attachment({ severity: "good", title: "x" }).color).toBe("#2eb886");
  });

  it("splits fields across sections at Block Kit's limit of 10", () => {
    const fields = Array.from({ length: 23 }, (_, i) => ({
      label: `l${i}`,
      value: `v${i}`,
    }));

    const sections = attachment({
      severity: "info",
      title: "many fields",
      fields,
    }).blocks.filter((block) => block.fields !== undefined);

    expect(sections.map((section) => section.fields?.length)).toEqual([
      10, 10, 3,
    ]);
  });

  it("separates label and value with an escape, not a real newline", () => {
    // The built bundle is pasted into the Cloudflare dashboard editor by hand.
    // A real newline inside a string splits the bundle across lines, where an
    // editor auto-indenting on paste corrupts it. `pnpm bundle` enforces the
    // one-line result; this pins the rendered output that depends on it.
    const section = attachment({
      severity: "info",
      title: "t",
      fields: [{ label: "Environment", value: "prod" }],
    }).blocks.find((block) => block.fields !== undefined);

    expect(section?.fields?.[0]).toEqual({
      type: "mrkdwn",
      text: "*Environment*\nprod",
    });
  });

  it("clamps a header past Slack's 150-character plain_text limit", () => {
    const header = expectDefined(
      attachment({ severity: "info", title: "T".repeat(400) }).blocks[0],
      "a header block",
    );
    const text = expectDefined(header.text, "header text").text;

    expect(text.length).toBeLessThanOrEqual(150);
    expect(text.endsWith("…")).toBe(true);
  });

  it("omits optional blocks that were not supplied", () => {
    const blocks = attachment({ severity: "info", title: "bare" }).blocks;
    expect(blocks.map((block) => block.type)).toEqual(["header"]);
  });

  it("emits body, fields, button and context in a stable order", () => {
    const blocks = attachment({
      severity: "warning",
      title: "full",
      body: "something happened",
      fields: [{ label: "Environment", value: "prod" }],
      link: { text: "Open", url: "https://example.test" },
      context: "at 03:00",
    }).blocks;

    expect(blocks.map((block) => block.type)).toEqual([
      "header",
      "section",
      "section",
      "actions",
      "context",
    ]);
  });
});
