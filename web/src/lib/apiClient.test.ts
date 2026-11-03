import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { apiFetch } from "./apiClient";
import { ApiError } from "./apiError";
import { getUserMessage } from "./errorMessages";

// fetch is replaced with a fake so tests run instantly, offline, and can simulate any server behaviour.
function mockFetch(response: Response | Error) {
  const fn = vi.fn(() => (response instanceof Error ? Promise.reject(response) : Promise.resolve(response)));
  vi.stubGlobal("fetch", fn);
  return fn;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

afterEach(() => vi.unstubAllGlobals());

describe("apiFetch", () => {
  it("returns data validated against the schema, and sends the login cookie", async () => {
    const fetchMock = mockFetch(json({ id: 1 }));
    const result = await apiFetch("/thing", { schema: z.object({ id: z.number() }) });

    expect(result).toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/thing",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("turns the backend error envelope into an ApiError", async () => {
    mockFetch(json({ error: { code: "EMAIL_TAKEN", message: "taken" } }, 409));

    await expect(apiFetch("/auth/register", { method: "POST", body: {} })).rejects.toMatchObject({
      name: "ApiError",
      status: 409,
      code: "EMAIL_TAKEN",
    });
  });

  it("reports a network failure as NETWORK_ERROR with status 0", async () => {
    mockFetch(new TypeError("Failed to fetch"));

    await expect(apiFetch("/orders", { schema: z.unknown() })).rejects.toMatchObject({
      status: 0,
      code: "NETWORK_ERROR",
    });
  });

  it("copes with non-JSON error bodies (e.g. a proxy's HTML 502 page)", async () => {
    mockFetch(new Response("<html>Bad Gateway</html>", { status: 502 }));

    await expect(apiFetch("/orders", { schema: z.unknown() })).rejects.toMatchObject({
      status: 502,
      code: "UNKNOWN_ERROR",
    });
  });

  it("rejects a 2xx response whose shape breaks the contract", async () => {
    mockFetch(json({ id: "not-a-number" }));

    await expect(apiFetch("/thing", { schema: z.object({ id: z.number() }) })).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
  });

  it("handles 204 No Content without trying to parse a body", async () => {
    mockFetch(new Response(null, { status: 204 }));
    await expect(apiFetch("/auth/logout", { method: "POST" })).resolves.toBeUndefined();
  });
});

describe("getUserMessage", () => {
  it("maps known codes to friendly text and never leaks the server's own message", () => {
    const error = new ApiError(401, "INVALID_CREDENTIALS", "SELECT ... failed: internal detail");
    expect(getUserMessage(error)).toBe("Incorrect email or password.");
  });

  it("uses a generic server message for unknown 5xx errors", () => {
    expect(getUserMessage(new ApiError(500, "INTERNAL_ERROR", "boom"))).toMatch(/our side/);
  });

  it("falls back to a generic message for non-API errors", () => {
    expect(getUserMessage(new Error("anything"))).toBe("Something went wrong. Please try again.");
  });
});
