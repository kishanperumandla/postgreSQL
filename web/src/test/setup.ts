// Runs before every test file (configured in vite.config.ts -> test.setupFiles).
import "@testing-library/jest-dom/vitest"; // adds matchers like expect(el).toBeInTheDocument()
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount whatever a test rendered, so tests can't leak DOM into each other.
afterEach(() => cleanup());
