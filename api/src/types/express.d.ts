// Type augmentation: tells TypeScript that `req.user` may exist on every Express request.
//
// `requireAuth` (middleware/requireAuth.ts) fills it from the verified login cookie.
// Controllers read the owner of a request from here - NEVER from the request body/query -
// which is what stops a user from creating or reading orders under someone else's id.
//
// IF SKIPPED: `req.user` would be a compile error everywhere, and the temptation is to cast to
// `any`, which silently removes type-safety around the most security-sensitive value we have.
export {}; // makes this file a module so `declare global` below augments instead of replacing

declare global {
  namespace Express {
    interface Request {
      user?: { id: number };
    }
  }
}
