import type { Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { AppError } from "../../lib/errors";

// ---------------------------------------------------------------------------
// Everything about the login TOKEN and the COOKIE that carries it lives here,
// so there is exactly one place to change when auth mechanics evolve
// (e.g. adding refresh tokens, or the API gateway taking over verification).
// ---------------------------------------------------------------------------

export const AUTH_COOKIE_NAME = "access_token";

// Sign a JWT whose only claim is the user id (`sub` = "subject").
// Keep tokens minimal: everything inside is readable by anyone holding it (it is signed, not encrypted).
// `algorithm` is pinned so we always sign with HS256.
export function signAccessToken(userId: number): string {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: String(userId),
    expiresIn: env.JWT_EXPIRES_IN_SECONDS,
    algorithm: "HS256",
  });
}

// Verify signature + expiry and return the user id.
// `algorithms: ["HS256"]` is a SECURITY control: without it, a forged token that claims
// `alg: none` ("unsigned") or a different algorithm could be accepted by older/misconfigured libraries.
export function verifyAccessToken(token: string): number {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
    const userId = typeof payload === "string" ? NaN : Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error("token has no valid subject");
    }
    return userId;
  } catch {
    // Expired, tampered, malformed ... the client gets the same answer: "log in again".
    // We deliberately don't say WHY, to avoid helping someone crafting tokens.
    throw AppError.unauthorized("Session is invalid or has expired");
  }
}

// Cookie flags - each one closes a specific attack:
//  httpOnly  JavaScript (including injected XSS scripts) cannot read the cookie, so a script
//            cannot steal the login token. (This is the main reason we avoid localStorage.)
//  secure    Only sent over HTTPS. Off in development because localhost is plain HTTP.
//  sameSite  "lax": the browser does NOT attach the cookie to cross-site POST/PUT/DELETE
//            requests, which blocks classic CSRF (another site making your browser call our API).
//  path "/"  Sent for every API route.
function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export function setAuthCookie(res: Response, token: string): void {
  // maxAge is in milliseconds. It matches the JWT lifetime so cookie and token expire together.
  res.cookie(AUTH_COOKIE_NAME, token, { ...cookieOptions(), maxAge: env.JWT_EXPIRES_IN_SECONDS * 1000 });
}

export function clearAuthCookie(res: Response): void {
  // To delete a cookie the browser needs the SAME path/sameSite/secure it was set with;
  // otherwise it treats this as a different cookie and the login stays in place.
  res.clearCookie(AUTH_COOKIE_NAME, cookieOptions());
}
