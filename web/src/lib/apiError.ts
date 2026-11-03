// ApiError = every failed API call, normalised into one class.
//
// The backend answers errors as { error: { code, message, details } }. apiClient.ts turns that into
// an ApiError, so the rest of the app never touches raw Response objects or guesses JSON shapes.
//
// Frontend decisions use `status` + `code`. The server's `message` is kept for debugging only and
// is NEVER shown to users (see errorMessages.ts): server text can change, be technical, or be
// missing entirely (e.g. an HTML 502 page from a proxy).
export type ApiErrorDetails = {
  formErrors?: string[];
  // { email: ["Enter a valid email address"], password: ["..."] } - used to mark individual form fields.
  fieldErrors?: Record<string, string[]>;
};

export class ApiError extends Error {
  readonly status: number; // HTTP status; 0 means "never got a response" (network failure)
  readonly code: string; // stable machine code, e.g. "EMAIL_TAKEN"
  readonly details?: ApiErrorDetails;

  constructor(status: number, code: string, message: string, details?: ApiErrorDetails) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Type guard: after `if (isApiError(e))` TypeScript knows e.status / e.code exist.
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
