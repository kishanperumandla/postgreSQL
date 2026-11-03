import { Router } from "express";
import { authLimiter } from "../../middleware/rateLimit";
import { requireAuth } from "../../middleware/requireAuth";
import * as authController from "./auth.controller";

// ROUTE LAYER: only wiring - "this URL + method runs these middlewares, then this controller".
// Mounted at /api/v1/auth in app.ts.
export const authRouter = Router();

// Public routes, but rate-limited against password guessing / mass sign-ups.
authRouter.post("/register", authLimiter, authController.register);
authRouter.post("/login", authLimiter, authController.login);

// Logout needs no auth check: clearing an already-missing cookie is harmless.
authRouter.post("/logout", authController.logout);

// Protected: requireAuth runs first and rejects with 401 if the cookie is missing/invalid.
authRouter.get("/me", requireAuth, authController.me);
