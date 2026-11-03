import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
// `defineConfig` from "vitest/config" is the normal Vite config helper plus the typed `test` block below.
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],

  resolve: {
    // `@/features/orders/hooks` instead of `../../../features/orders/hooks`.
    // Deep relative paths break whenever a file moves; an alias doesn't. (Mirrored in tsconfig.app.json "paths".)
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },

  server: {
    port: 5173,
    proxy: {
      // THE KEY DEV SETTING. The browser only ever talks to http://localhost:5173. Anything under /api is
      // forwarded by Vite to the Express API. Consequences:
      //  - same origin => no CORS preflight requests, and the httpOnly login cookie is a plain first-party
      //    cookie (cross-origin cookies need SameSite=None+Secure, which doesn't work on plain http://localhost)
      //  - the code uses the SAME relative URL ("/api/v1/...") in dev and in production, where a reverse
      //    proxy / API gateway plays the role Vite plays here. When the backend is split into microservices,
      //    only the gateway changes; this file and the frontend code don't.
      // IF REMOVED: requests to /api would hit Vite itself and return index.html, and you would need CORS +
      // cross-site cookie hacks to talk to localhost:3000 directly.
      "/api": { target: "http://localhost:3000" },
    },
  },

  test: {
    environment: "jsdom", // a simulated browser DOM so React components can render in tests
    setupFiles: ["./src/test/setup.ts"],
    css: false, // tests don't need to compile Sass
  },
});
