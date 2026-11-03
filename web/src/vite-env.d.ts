/// <reference types="vite/client" />

// Types for the VITE_* variables the app reads (see lib/env.ts and web/.env.example).
// Vite only exposes variables that start with VITE_ to browser code, and EVERYTHING exposed is
// public (it is baked into the JavaScript bundle). Never put secrets in a VITE_ variable.
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
