import { createApp } from "./app";
import { env } from "./config/env";
import { pool } from "./db";

const server = createApp().listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});

// GRACEFUL SHUTDOWN. Deploys, `tsx watch` restarts and Ctrl+C send SIGTERM/SIGINT.
// Steps: stop accepting new connections -> let in-flight requests finish -> close DB connections -> exit.
// IF SKIPPED: the process dies mid-request (clients get dropped connections / half-finished
// writes) and Postgres is left holding connections until they time out.
function shutdown(signal: string) {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  // Safety net: if something hangs (a stuck keep-alive connection), force exit after 10 s.
  // unref() so this timer alone never keeps the process alive.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
