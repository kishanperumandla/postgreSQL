import { toast } from "sonner";
import { isApiError } from "./apiError";

// CENTRALISED, USER-FACING ERROR TEXT. Every error toast in the app goes through this one mapping.
//
// Why: (1) users get friendly, consistent wording; (2) raw backend text (SQL hints, stack-ish
// messages, "Invalid input: expected number, received NaN") never reaches the screen; (3) changing
// the wording of a message is a one-line edit here instead of a hunt through components.
// IF SKIPPED: each component would write its own `toast.error(error.message)` and show whatever the
// server (or the browser, e.g. "Failed to fetch") happens to say.

// Messages by backend error `code` (see api/src/lib/errors.ts and the services).
const MESSAGES_BY_CODE: Record<string, string> = {
  NETWORK_ERROR: "Can't reach the server. Check your connection and try again.",
  INVALID_CREDENTIALS: "Incorrect email or password.",
  EMAIL_TAKEN: "An account with this email already exists.",
  UNAUTHENTICATED: "Your session has expired. Please log in again.",
  RATE_LIMITED: "Too many attempts. Please wait a few minutes and try again.",
  VALIDATION_ERROR: "Please check the highlighted fields.",
  NOT_FOUND: "We couldn't find what you were looking for.",
  INVALID_RESPONSE: "The server sent an unexpected response. Please try again later.",
};

const GENERIC_MESSAGE = "Something went wrong. Please try again.";
const SERVER_MESSAGE = "Something went wrong on our side. Please try again in a moment.";

export function getUserMessage(error: unknown): string {
  if (!isApiError(error)) return GENERIC_MESSAGE;
  const byCode = MESSAGES_BY_CODE[error.code];
  if (byCode) return byCode;
  if (error.status >= 500) return SERVER_MESSAGE;
  return GENERIC_MESSAGE;
}

// Show an error toast. Called from ONE place: the global handlers in app/queryClient.ts, so
// individual components don't (and shouldn't) call toast.error for API failures themselves.
export function notifyError(error: unknown): void {
  toast.error(getUserMessage(error));
}
