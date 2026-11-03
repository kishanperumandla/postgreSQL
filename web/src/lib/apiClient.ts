import type { z } from "zod";
import { ApiError, type ApiErrorDetails } from "./apiError";
import { API_BASE_URL } from "./env";

// The ONLY place in the app that calls fetch(). The services (services/*Service.ts) use this.
//
// Why a wrapper instead of calling fetch everywhere:
//  - cookies:   `credentials: "include"` is set once, so the httpOnly login cookie is always sent
//  - JSON:      headers + stringify + parse in one place
//  - errors:    non-2xx responses and network failures become ApiError (a single type to handle)
//  - contract:  responses are validated with zod, so a backend change that breaks the contract fails
//               loudly HERE instead of as "undefined is not a function" deep inside a component

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  signal?: AbortSignal; // TanStack Query passes one so superseded requests are cancelled
};

// Overloads: with a `schema` the result is typed from it; without one (e.g. DELETE / logout) it's void.
export async function apiFetch<S extends z.ZodType>(
  path: string,
  options: RequestOptions & { schema: S },
): Promise<z.output<S>>;
export async function apiFetch(path: string, options?: RequestOptions): Promise<void>;
export async function apiFetch(
  path: string,
  options: RequestOptions & { schema?: z.ZodType } = {},
): Promise<unknown> {
  const { method = "GET", body, signal, schema } = options;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: "include", // send/receive the login cookie
      signal,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (cause) {
    // A cancelled request is not an error to report; let the abort propagate untouched.
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    // fetch only REJECTS when no response arrived at all (offline, DNS, server down, CORS block).
    throw new ApiError(0, "NETWORK_ERROR", "Network request failed");
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  // 204 No Content (logout, delete): there is no body to parse.
  if (response.status === 204 || !schema) {
    return undefined;
  }

  const json: unknown = await response.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    // The server answered 2xx but with a shape we don't understand: frontend/backend contract drift.
    throw new ApiError(response.status, "INVALID_RESPONSE", "Response did not match the expected shape");
  }
  return parsed.data;
}

// Convert a non-2xx Response into an ApiError, tolerating bodies that aren't our JSON envelope
// (a proxy's HTML "502 Bad Gateway", an empty body ...).
async function toApiError(response: Response): Promise<ApiError> {
  try {
    const json: unknown = await response.json();
    if (typeof json === "object" && json !== null && "error" in json) {
      const error = (json as { error: { code?: unknown; message?: unknown; details?: unknown } }).error;
      if (typeof error?.code === "string") {
        return new ApiError(
          response.status,
          error.code,
          typeof error.message === "string" ? error.message : response.statusText,
          error.details as ApiErrorDetails | undefined,
        );
      }
    }
  } catch {
    // body wasn't JSON - fall through to the generic error
  }
  return new ApiError(response.status, "UNKNOWN_ERROR", response.statusText || "Request failed");
}
