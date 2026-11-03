import rateLimit from "express-rate-limit";
import { AppError } from "../lib/errors";

// Brute-force protection for /auth/login and /auth/register.
//
// Without it, a script can try thousands of passwords per minute against one account
// (bcrypt slows each guess down, but not enough on its own).
//
// Settings:
//  - 10 FAILED attempts per IP per 15 minutes. `skipSuccessfulRequests` means normal users who
//    log in correctly are never counted - only attempts that came back 4xx/5xx.
//  - Responses use our standard AppError shape (429) so the frontend can show a clear toast.
//
// KNOWN LIMITS (fine for now, revisit for production):
//  - The counter lives in this process's memory: it resets on restart and is NOT shared between
//    several API instances. Behind a load balancer/gateway, use a shared store (e.g. Redis).
//  - Behind a proxy, Express must be told to trust it (`app.set("trust proxy", ...)`), otherwise
//    every user appears to come from the proxy's IP and they share one counter.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8", // sends RateLimit-* headers so clients can see their budget
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new AppError(429, "RATE_LIMITED", "Too many attempts. Please try again later."));
  },
});
