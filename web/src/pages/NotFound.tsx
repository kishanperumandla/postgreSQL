import { Link } from "react-router";

// Rendered by the catch-all route (path "*") for any URL nothing else matched.
export default function NotFound() {
  return (
    <main className="auth-layout">
      <div className="state-box card">
        <h1>404</h1>
        <p className="text-muted">We couldn't find that page.</p>
        <Link to="/dashboard" className="btn-primary">
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
