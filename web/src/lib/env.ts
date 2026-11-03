// The one place the frontend reads build-time configuration (same idea as api/src/config/env.ts).
//
// Default is a RELATIVE url: the browser asks its own origin for /api/v1/..., and something in
// front of the API forwards it (Vite's dev proxy today, a reverse proxy / API gateway in production).
// IF THIS WERE HARD-CODED to "http://localhost:3000": it would break in every other environment, and it
// would be cross-origin, which brings CORS and cookie problems back.
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
