import type { Request, Response, NextFunction } from "express";
import { AUTH_COOKIE_NAME, verifyAccessToken } from "../modules/auth/auth.tokens";
import { AppError } from "../lib/errors";

// Gatekeeper for protected routes. Put it BEFORE the handlers it protects.
//
// What it does:
//   1. reads the login cookie (cookie-parser has already put cookies on req.cookies)
//   2. verifies the JWT signature + expiry
//   3. stores the user id on req.user for controllers to use
// Any failure -> 401, and the protected handler never runs.
//
// IF A ROUTE FORGETS THIS MIDDLEWARE: it becomes public, and `currentUserId()` below throws
// (a loud 401 instead of silently running as "nobody"). Orders routes apply it once with
// `router.use(requireAuth)` so a newly added route cannot forget it.
//
// ARCHITECTURE NOTE: this verifies a SELF-CONTAINED token, with no DB lookup, so it works in any
// service that shares the secret. When an API gateway is added, it can do this step and forward
// the user id to services in a header; only this file changes.
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token: unknown = req.cookies?.[AUTH_COOKIE_NAME];
  if (typeof token !== "string" || token === "") {
    throw AppError.unauthorized();
  }
  req.user = { id: verifyAccessToken(token) };
  next();
}

// The ONLY sanctioned way for controllers to learn "who is calling".
// Never read a user id from req.body / req.query / req.params for ownership: those are
// attacker-controlled. If a client could choose the id, any user could create or read
// orders as any other user (an "IDOR" - insecure direct object reference).
export function currentUserId(req: Request): number {
  if (!req.user) {
    throw AppError.unauthorized();
  }
  return req.user.id;
}
