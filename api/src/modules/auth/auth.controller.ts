import type { Request, Response } from "express";
import { currentUserId } from "../../middleware/requireAuth";
import { loginSchema, registerSchema } from "./auth.schemas";
import * as authService from "./auth.service";
import { clearAuthCookie, setAuthCookie } from "./auth.tokens";

// CONTROLLER LAYER: the translator between HTTP and the service.
//   request in  -> validate/parse -> call service -> choose status code + JSON out.
// It contains no business rules and no SQL.
//
// No try/catch needed: Express 5 forwards thrown errors and rejected promises from async
// handlers to errorHandler automatically. (On Express 4 each handler would need try/catch+next.)

// POST /auth/register
export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body); // throws ZodError -> 400 with field messages
  const user = await authService.register(input);
  // 201 Created. We do NOT log the user in here: the UI sends them to the login page, which keeps
  // "create an account" and "start a session" as two separate, simple steps.
  res.status(201).json({ user });
}

// POST /auth/login
export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const { user, token } = await authService.login(input);
  setAuthCookie(res, token); // the token travels ONLY in the httpOnly cookie, not in the JSON body
  res.status(200).json({ user });
}

// POST /auth/logout
export function logout(_req: Request, res: Response) {
  // Limitation of stateless JWTs: we can erase the browser's cookie, but a copy of the token that
  // was already stolen stays valid until it expires. Truly revocable sessions need a server-side
  // store (refresh tokens / session table) - a planned upgrade, not needed to learn the flow.
  clearAuthCookie(res);
  res.status(204).send();
}

// GET /auth/me   (route is protected by requireAuth)
export async function me(req: Request, res: Response) {
  const user = await authService.getCurrentUser(currentUserId(req));
  res.status(200).json({ user });
}
