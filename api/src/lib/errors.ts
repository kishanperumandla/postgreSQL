// AppError = an error we EXPECT and want to tell the client about
// (bad login, order not found, email taken ...).
//
// Services/controllers `throw` it; the central errorHandler middleware turns it into a JSON
// response. Anything that is NOT an AppError is treated as an unexpected bug (HTTP 500) and its
// details are hidden from the client.
//
// PURPOSE of `code`: a stable, machine-readable string (e.g. "EMAIL_TAKEN"). The frontend decides
// what to show/do from `status` + `code`; it never parses the human `message`, which we are
// free to reword. This is also the contract that stays stable when the API is split into services.
//
// IF SKIPPED: every handler would hand-write `res.status(..).json(..)` in its own shape, the
// frontend would need a special case per endpoint, and an unexpected error could leak internals.
export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(code: string, message: string, details?: unknown) {
    return new AppError(400, code, message, details);
  }

  // 401 = "we don't know who you are" (no/invalid/expired login). Not to be confused with 403.
  static unauthorized(message = "Authentication required") {
    return new AppError(401, "UNAUTHENTICATED", message);
  }

  // Used for BOTH "does not exist" and "exists but belongs to someone else" so that
  // a user cannot discover which order ids exist by probing (see orders.service.ts).
  static notFound(what = "Resource") {
    return new AppError(404, "NOT_FOUND", `${what} not found`);
  }

  static conflict(code: string, message: string) {
    return new AppError(409, code, message);
  }
}
