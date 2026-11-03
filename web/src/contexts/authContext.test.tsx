import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/hooks/useAuth";
import { clearCachedUserData } from "@/lib/queryClient";
import AuthProvider from "./authContext";

const ada = { id: 1, name: "Ada", email: "ada@example.com" };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// A tiny fake API: each call is answered by method + URL, and we remember whether "the server" has a session.
function fakeApi() {
  let loggedIn = false;
  return vi.fn((url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    if (url.endsWith("/auth/me")) {
      return Promise.resolve(
        loggedIn ? json({ user: ada }) : json({ error: { code: "UNAUTHENTICATED", message: "x" } }, 401),
      );
    }
    if (url.endsWith("/auth/login") && method === "POST") {
      loggedIn = true;
      return Promise.resolve(json({ user: ada }));
    }
    if (url.endsWith("/auth/logout") && method === "POST") {
      loggedIn = false;
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    return Promise.reject(new Error(`unexpected request ${method} ${url}`));
  });
}

// Minimal consumer: prints who is logged in and exposes the two actions.
function Probe() {
  const { user, isLoading, login, logout } = useAuth();
  if (isLoading) return <p>checking</p>;
  return (
    <>
      <p>{user ? `hello ${user.name}` : "logged out"}</p>
      <button onClick={() => login({ email: "ada@example.com", password: "pw" })}>do login</button>
      <button onClick={logout}>do logout</button>
    </>
  );
}

function renderProbe(queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return queryClient;
}

afterEach(() => vi.unstubAllGlobals());

describe("AuthProvider", () => {
  it("starts logged out, logs in, then logs out - and the UI follows each step", async () => {
    vi.stubGlobal("fetch", fakeApi());
    const user = userEvent.setup();
    renderProbe();

    expect(await screen.findByText("logged out")).toBeInTheDocument();

    await user.click(screen.getByText("do login"));
    expect(await screen.findByText("hello Ada")).toBeInTheDocument();

    // Regression test for the queryClient.clear() trap: after logout the mounted provider MUST update.
    await user.click(screen.getByText("do logout"));
    expect(await screen.findByText("logged out")).toBeInTheDocument();
  });

  it("throws a clear error when useAuth is used outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {}); // React logs the thrown error; keep test output clean
    expect(() => render(<Probe />)).toThrow(/inside <AuthProvider>/);
  });
});

describe("clearCachedUserData", () => {
  it("removes other users' data but keeps the auth entry", () => {
    const client = new QueryClient();
    client.setQueryData(["auth", "me"], ada);
    client.setQueryData(["orders", "list", { limit: 10, offset: 0 }], { data: [] });

    clearCachedUserData(client);

    expect(client.getQueryData(["auth", "me"])).toEqual(ada);
    expect(client.getQueryData(["orders", "list", { limit: 10, offset: 0 }])).toBeUndefined();
  });
});
