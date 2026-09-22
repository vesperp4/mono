import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import worker, { parseGenericMessage, type Env } from "../src/index";

const ENV: Env = {
  SLACK_WEBHOOK_ALERTS: "https://hooks.slack.test/services/T/B/x",
  RELAY_TOKEN: "s3cret-token",
};

const AZURE_ALERT = {
  schemaId: "azureMonitorCommonAlertSchema",
  data: {
    essentials: {
      alertRule: "portal-api email send failures",
      severity: "Sev1",
      monitorCondition: "Fired",
      alertTargetIDs: [
        "/subscriptions/s/resourceGroups/vesperp4-prod-rg/providers/Microsoft.App/containerApps/portal-api-prod",
      ],
    },
  },
};

function post(path: string, body: unknown, init: RequestInit = {}): Request {
  return new Request(`https://relay.test${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    ...init,
  });
}

let slack: ReturnType<typeof vi.fn>;

beforeEach(() => {
  slack = vi.fn(async () => new Response("ok", { status: 200 }));
  vi.stubGlobal("fetch", slack);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("routing", () => {
  it("answers /health without a token", async () => {
    const response = await worker.fetch(
      new Request("https://relay.test/health"),
      ENV,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });

  it("rejects a GET on a delivery route", async () => {
    const response = await worker.fetch(
      new Request("https://relay.test/azure?token=s3cret-token"),
      ENV,
    );
    expect(response.status).toBe(405);
  });

  it("404s an unknown path before checking auth", async () => {
    const response = await worker.fetch(post("/nope", {}), ENV);
    expect(response.status).toBe(404);
  });
});

describe("auth", () => {
  it("rejects a request with no token", async () => {
    const response = await worker.fetch(post("/azure", AZURE_ALERT), ENV);

    expect(response.status).toBe(401);
    expect(slack).not.toHaveBeenCalled();
  });

  it("rejects a wrong token of the same length", async () => {
    const response = await worker.fetch(
      post("/azure?token=s3cret-tokeX", AZURE_ALERT),
      ENV,
    );
    expect(response.status).toBe(401);
  });

  it("accepts the token in the query string, as Azure action groups require", async () => {
    const response = await worker.fetch(
      post("/azure?token=s3cret-token", AZURE_ALERT),
      ENV,
    );
    expect(response.status).toBe(200);
  });

  it("accepts a bearer header too", async () => {
    const response = await worker.fetch(
      post("/azure", AZURE_ALERT, {
        headers: { authorization: "Bearer s3cret-token" },
      }),
      ENV,
    );
    expect(response.status).toBe(200);
  });

  it("stays closed when RELAY_TOKEN is unset", async () => {
    const response = await worker.fetch(post("/azure?token=", AZURE_ALERT), {
      ...ENV,
      RELAY_TOKEN: "",
    });

    expect(response.status).toBe(401);
    expect(slack).not.toHaveBeenCalled();
  });
});

describe("POST /azure", () => {
  it("posts a formatted message to the Slack webhook", async () => {
    await worker.fetch(post("/azure?token=s3cret-token", AZURE_ALERT), ENV);

    expect(slack).toHaveBeenCalledOnce();
    const call = slack.mock.calls[0] as [string, RequestInit] | undefined;
    if (!call) throw new Error("expected a Slack call");
    const [url, init] = call;
    expect(url).toBe(ENV.SLACK_WEBHOOK_ALERTS);

    const payload = JSON.parse(String(init.body)) as {
      text: string;
      attachments: Array<{ color: string }>;
    };
    expect(payload.text).toBe("portal-api email send failures");
    expect(payload.attachments[0]?.color).toBe("#d7263d");
  });

  it("explains itself when the action group is not on the common schema", async () => {
    const response = await worker.fetch(
      post("/azure?token=s3cret-token", { context: { name: "legacy" } }),
      ENV,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("common alert schema"),
    });
    expect(slack).not.toHaveBeenCalled();
  });

  it("returns 502 so Azure Monitor retries when Slack is down", async () => {
    slack.mockResolvedValue(new Response("no_service", { status: 404 }));

    const response = await worker.fetch(
      post("/azure?token=s3cret-token", AZURE_ALERT),
      ENV,
    );
    expect(response.status).toBe(502);
  });

  it("rejects a malformed JSON body", async () => {
    const response = await worker.fetch(
      new Request("https://relay.test/azure?token=s3cret-token", {
        method: "POST",
        body: "{not json",
      }),
      ENV,
    );
    expect(response.status).toBe(400);
  });

  it("fails loudly when the Slack webhook is not configured", async () => {
    const response = await worker.fetch(
      post("/azure?token=s3cret-token", AZURE_ALERT),
      { ...ENV, SLACK_WEBHOOK_ALERTS: "" },
    );
    expect(response.status).toBe(500);
  });
});

describe("parseGenericMessage", () => {
  it("requires a title", () => {
    expect(parseGenericMessage({})).toBe("title is required");
    expect(parseGenericMessage({ title: "  " })).toBe("title is required");
    expect(parseGenericMessage("string")).toBe("body must be a JSON object");
  });

  it("rejects an unknown severity rather than silently downgrading it", () => {
    expect(parseGenericMessage({ title: "t", severity: "urgent" })).toContain(
      "severity must be one of",
    );
  });

  it("defaults severity to info and coerces field values to strings", () => {
    const parsed = parseGenericMessage({
      title: "t",
      fields: [{ label: "Run", value: 42 }, "junk"],
    });

    expect(typeof parsed).not.toBe("string");
    expect(parsed).toMatchObject({
      severity: "info",
      fields: [{ label: "Run", value: "42" }],
    });
  });

  it("drops a link with no url", () => {
    expect(parseGenericMessage({ title: "t", link: { text: "x" } })).toMatchObject(
      { link: undefined },
    );
  });
});
