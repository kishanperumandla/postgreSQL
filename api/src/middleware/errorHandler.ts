import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppError } from "../lib/errors";

// EVERY error response from this API has exactly this JSON shape:
//   { "error": { "code": "SOME_CODE", "message": "Human readable", "details": ... } }
// One shape = one place in the frontend that understands API errors.

// 404 for any URL that no router matched. Registered AFTER all routes (see app.ts).
export function notFound(req: Request, res: Response) {
  res.status(404).json({
    error: { code: "ROUTE_NOT_FOUND", message: `Route ${req.method} ${req.path} not found` },
  });
}

// The 4-argument signature is how Express recognises an ERROR handler - all four parameters
// must be declared even though `_next` is unused. Remove one and Express treats this as a normal
// middleware, and errors would fall through to Express's default HTML error page.
// In Express 5, a rejected promise / thrown error in any async handler lands here automatically.
export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction) {
  // If a response is already partly sent we can't write a new one; hand over to Express's default.
  if (res.headersSent) {
    next(err);
    return;
  }

  // 1. Errors we threw on purpose (wrong password, not found, email taken ...).
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  // 2. A zod schema.parse() failed in a controller: the client sent invalid input.
  //    `fieldErrors` looks like { email: ["Invalid email"], password: ["Too short"] } so the
  //    frontend can show each message next to the right form field.
  if (err instanceof z.ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Some fields are invalid",
        details: z.flattenError(err),
      },
    });
    return;
  }

  // 3. Errors raised by express.json() before our code runs.
  if (typeof err === "object" && err !== null && "type" in err) {
    if (err.type === "entity.parse.failed") {
      res.status(400).json({ error: { code: "INVALID_JSON", message: "Request body is not valid JSON" } });
      return;
    }
    if (err.type === "entity.too.large") {
      res.status(413).json({ error: { code: "PAYLOAD_TOO_LARGE", message: "Request body is too large" } });
      return;
    }
  }

  // 4. Anything else is a bug or an outage (DB down, TypeError ...).
  //    Log the real error for developers, but send the client NOTHING specific:
  //    stack traces, SQL and table names help attackers and mean nothing to users.
  console.error(err);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong" } });
}
