// Central, validated configuration.
//
// PURPOSE: every environment variable is read and validated in ONE place, at startup.
// The rest of the code imports `env` (typed, already parsed) and never touches process.env.
//
// IF THIS WERE SKIPPED: a missing/typo'd variable would not fail at startup. It would surface
// later as `undefined` deep in the code - e.g. jwt.sign() with an undefined secret, or a
// "port NaN" connection error - far from the real cause. Worse, a too-short JWT_SECRET would
// silently make every login cookie easy to forge.
import "dotenv/config"; // loads api/.env into process.env (must run before we read it below)
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // z.coerce.number(): env vars are always strings, so "3000" must be converted to 3000.
  PORT: z.coerce.number().int().positive().default(3000),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  // Optional: local Homebrew Postgres uses trust auth (no password). Production will have one.
  DB_PASSWORD: z.string().optional(),

  // HS256 signing key. 32+ chars so it cannot be brute-forced; a short secret = forgeable logins.
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  // Seconds, not "1d": jsonwebtoken's types want a number, and the cookie lifetime needs the same value.
  JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24),

  // The single browser origin allowed to send cookies to this API (see CORS in app.ts).
  CORS_ORIGIN: z.url().default("http://localhost:5173"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast and loudly: a server that boots with a bad config is worse than one that refuses to boot.
  console.error("Invalid environment configuration:", z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
