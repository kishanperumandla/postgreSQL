import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { pool } from "./db";
import { errorHandler, notFound } from "./middleware/errorHandler";
import { authRouter } from "./modules/auth/auth.routes";
import { ordersRouter } from "./modules/orders/orders.routes";

// Builds the Express app but does NOT start listening. index.ts does that.
// Keeping them separate lets automated tests import the app and call it without opening a port.
export function createApp() {
  const app = express();

  app.disable("x-powered-by"); // don't advertise "Express" to scanners

  // MIDDLEWARE ORDER MATTERS: each request passes through these top to bottom.

  // Security headers (X-Content-Type-Options, HSTS, frame protection ...). One line, many protections.
  app.use(helmet());

  // CORS: which BROWSER origins may call us.
  //  - A single explicit origin instead of "*": the wildcard is forbidden together with cookies,
  //    and would let any website talk to the API with the user's session.
  //  - credentials: true lets the browser send/receive our httpOnly login cookie cross-origin.
  // (In development the Vite proxy makes requests same-origin, so CORS isn't even exercised;
  //  this is the safety net for when the web app is served from another origin.)
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

  // Parses JSON bodies into req.body. The size cap stops someone sending a 500 MB body to eat memory.
  app.use(express.json({ limit: "100kb" }));

  // Parses the Cookie header into req.cookies (needed by requireAuth to read the login cookie).
  // Without it, req.cookies is undefined and every protected route answers 401.
  app.use(cookieParser());

  // Liveness/readiness probe for humans, load balancers and orchestrators. Kept OUTSIDE /api/v1
  // because infrastructure expects a stable URL that never changes with API versions.
  app.get("/health", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok", db: "up" });
    } catch (err) {
      console.error(err);
      res.status(503).json({ status: "error", db: "down" });
    }
  });

  // Versioned API. When a breaking change is needed, add /api/v2 and keep v1 working for
  // existing clients instead of breaking them. Each router below maps to a future microservice.
  const api = express.Router();
  api.use("/auth", authRouter);
  api.use("/orders", ordersRouter);
  app.use("/api/v1", api);

  // These two MUST come last: notFound catches URLs nothing matched, errorHandler catches every
  // error thrown above. Registered earlier, they would never see the routes' errors.
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
