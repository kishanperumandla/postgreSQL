import { Pool } from "pg";
import { env } from "./config/env";

// One shared connection pool for the whole process.
// A pool keeps a few connections open and lends them to queries. Opening a new Postgres
// connection per request is slow (TCP + auth handshake) and would exhaust the server's
// connection limit under load.
export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD || undefined, // "" -> undefined so the driver uses no password
});

// An idle pooled connection can be dropped by the database (restart, network blip).
// pg emits 'error' on the pool for that. With NO listener, Node treats it as an uncaught
// exception and the whole API process crashes. Logging it lets the pool replace the connection.
pool.on("error", (err) => {
  console.error("Unexpected error on idle database client", err);
});
