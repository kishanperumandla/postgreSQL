import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import AuthProvider from "@/contexts/authContext";
import { store } from "@/store";
import AuthenticatedLayout from "./AuthenticatedLayout";

// Renders the layout inside the SAME provider stack as main.tsx, with an in-memory router starting at /secret
// (no real browser URL) and a fake fetch standing in for the API.
function renderAtSecret(fetchImpl: () => Promise<Response>) {
  vi.stubGlobal("fetch", vi.fn(fetchImpl));
  // A fresh QueryClient per test so cached answers never leak between tests. retry:false = fail fast.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={["/secret"]}>
            <Routes>
              <Route path="login" element={<p>login page</p>} />
              <Route element={<AuthenticatedLayout />}>
                <Route path="secret" element={<p>secret page</p>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    </Provider>,
  );
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

afterEach(() => vi.unstubAllGlobals());

describe("AuthenticatedLayout", () => {
  it("shows the page inside the app shell when /auth/me returns a user", async () => {
    renderAtSecret(() =>
      Promise.resolve(json({ user: { id: 1, name: "Ada", email: "ada@example.com" } }, 200)),
    );
    expect(await screen.findByText("secret page")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toHaveTextContent("Ada"); // the header shows the user's name
  });

  it("redirects to /login when /auth/me answers 401 (not logged in)", async () => {
    renderAtSecret(() =>
      Promise.resolve(json({ error: { code: "UNAUTHENTICATED", message: "Authentication required" } }, 401)),
    );
    expect(await screen.findByText("login page")).toBeInTheDocument();
    expect(screen.queryByText("secret page")).not.toBeInTheDocument();
  });

  it("shows a retry screen - not the login page - when the server can't be reached", async () => {
    renderAtSecret(() => Promise.reject(new TypeError("Failed to fetch")));
    expect(await screen.findByText(/couldn't verify your session/i)).toBeInTheDocument();
    expect(screen.queryByText("login page")).not.toBeInTheDocument();
  });
});
