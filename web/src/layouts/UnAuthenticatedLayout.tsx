import { Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { PageSpinner, Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";

// LAYOUT + GUARD for the logged-OUT pages (login, register): a centred card with no navigation.
//
// The guard is the reverse of AuthenticatedLayout: a logged-in user has no business here, so send them into the app.
// This ALSO performs the post-login redirect. The Login page doesn't call navigate(): a successful login puts the
// user into the query cache, this component re-renders, sees a user, and redirects - to the page they were
// originally trying to open (state.from, set by AuthenticatedLayout) or the dashboard.
// One mechanism handles both "just logged in" and "typed /login while already logged in".
export default function UnAuthenticatedLayout() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageSpinner />;

  if (user) {
    const from = (location.state as { from?: { pathname: string; search?: string } } | null)?.from;
    return <Navigate to={from ? `${from.pathname}${from.search ?? ""}` : "/dashboard"} replace />;
  }

  // If the session check failed (server down) we still show the form: the login attempt itself will report the
  // network problem, which is more useful than a dead end.
  return (
    <main className="auth-layout">
      <div className="auth-card card">
        {/* Lazy-loaded pages need a Suspense boundary (see AuthenticatedLayout). */}
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </div>
    </main>
  );
}
