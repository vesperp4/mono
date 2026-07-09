import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The module reads env and keeps its cache at module scope, so each test
// gets a fresh import.
async function loadGroq() {
  const mod = await import("../src/sanity");
  return mod.groq;
}

function okResponse(result: unknown) {
  return {
    ok: true,
    json: async () => ({ result }),
  } as Response;
}

describe("groq", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("SANITY_PROJECT_ID", "testproj");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns null without fetching when SANITY_PROJECT_ID is unset", async () => {
    vi.stubEnv("SANITY_PROJECT_ID", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const groq = await loadGroq();

    expect(await groq("*[_type == 'x']")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("queries the CDN endpoint and returns the result", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse([{ _id: "a" }]));
    vi.stubGlobal("fetch", fetchMock);
    const groq = await loadGroq();

    expect(await groq("*[_type == 'x']")).toEqual([{ _id: "a" }]);
    const url = new URL(fetchMock.mock.calls[0]![0] as string);
    expect(url.hostname).toBe("testproj.apicdn.sanity.io");
    expect(url.searchParams.get("query")).toBe("*[_type == 'x']");
  });

  it("serves the cached result within the TTL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse("first"));
    vi.stubGlobal("fetch", fetchMock);
    const groq = await loadGroq();

    expect(await groq("q")).toBe("first");
    expect(await groq("q")).toBe("first");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refetches once the TTL has expired", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(okResponse("first"))
      .mockResolvedValueOnce(okResponse("second"));
    vi.stubGlobal("fetch", fetchMock);
    const groq = await loadGroq();

    expect(await groq("q")).toBe("first");
    vi.advanceTimersByTime(31_000);
    expect(await groq("q")).toBe("second");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("serves the stale result when a refresh gets a non-OK response", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(okResponse("first"))
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
      } as Response);
    vi.stubGlobal("fetch", fetchMock);
    const groq = await loadGroq();

    expect(await groq("q")).toBe("first");
    vi.advanceTimersByTime(31_000);
    expect(await groq("q")).toBe("first");
  });

  it("serves the stale result when a refresh rejects", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(okResponse("first"))
      .mockRejectedValueOnce(new Error("timeout"));
    vi.stubGlobal("fetch", fetchMock);
    const groq = await loadGroq();

    expect(await groq("q")).toBe("first");
    vi.advanceTimersByTime(31_000);
    expect(await groq("q")).toBe("first");
  });

  it("returns null on failure with nothing cached", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("boom"));
    vi.stubGlobal("fetch", fetchMock);
    const groq = await loadGroq();

    expect(await groq("q")).toBeNull();
  });
});
