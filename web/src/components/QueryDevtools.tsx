import { lazy, Suspense } from "react";

// Dev-only inspector for the query cache (shows every cached query, its state and age).
// `import.meta.env.DEV` is replaced by a literal `false` in production builds, so the bundler removes the whole dynamic
// import: the devtools code is never shipped to users, regardless of how the library behaves in production.
const Devtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((module) => ({ default: module.ReactQueryDevtools })),
    )
  : () => null;

export default function QueryDevtools() {
  return (
    <Suspense fallback={null}>
      <Devtools initialIsOpen={false} />
    </Suspense>
  );
}
