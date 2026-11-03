import { Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageSpinner } from "@/components/ui/Spinner";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";

// LAYOUT + GUARD for every page that needs a login (used as a layout <Route> in App.tsx).
// It does two jobs: (1) decides whether the visitor may see the page, (2) draws the app shell
// (header, content area, footer). <Outlet /> is the "hole" React Router fills with the matching child page.
//
// IMPORTANT: the redirect is a USABILITY feature, not security. Anyone can open DevTools and force these pages
// to render. The real protection is the API: every /orders endpoint answers 401 without a valid cookie
// (requireAuth), so a bypassed guard shows an empty page, never someone's data.
export default function AuthenticatedLayout() {
  const { user, isLoading, isError, refetch } = useAuth();
  const location = useLocation();

  // First load: we don't yet know whether the cookie is valid. Rendering the login page now would flash it at
  // already-logged-in users on every refresh, so wait for the answer.
  if (isLoading) return <PageSpinner />;

  // We couldn't even ASK (server down / offline). That's different from "not logged in": redirecting to /login
  // would be misleading, so say what happened and offer a retry.
  if (isError) {
    return (
      <div className="container app-main">
        <ErrorState
          message="We couldn't verify your session. Check your connection and try again."
          onRetry={refetch}
        />
      </div>
    );
  }

  // Not logged in -> /login. `replace` swaps the history entry, so Back doesn't bounce into the guard.
  // `state.from` remembers where the user was going so login can send them back there.
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return (
    <>
      <Header />
      <main className="app-main">
        <div className="container">
          {/* Pages are lazy-loaded (see App.tsx). While one's code downloads, React "suspends" and shows this
              fallback. Without a Suspense boundary above a lazy component, React throws an error. The header
              and footer stay on screen while only this middle part shows the spinner. */}
          <Suspense fallback={<PageSpinner />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
      <footer className="footer">Orders App · practice project</footer>
    </>
  );
}
