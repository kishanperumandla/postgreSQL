import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "@/components/ui/ErrorState";

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { hasError: boolean };

// SAFETY NET for UNEXPECTED crashes while rendering (a bug in a component, a lazy page whose code failed to download
// after a new deploy ...). IF MISSING: React unmounts the whole app and the user is left with a blank white screen.
//
// It must be a CLASS component: React only supports error boundaries through two class lifecycle methods;
// there is no hook equivalent. It does NOT catch errors in event handlers or async code (those are handled by
// try/catch and by the global TanStack Query error handler).
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  // React calls this when a child throws during render: switch to the fallback UI.
  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  // Also called after a crash: the place to LOG it (later: send to an error-tracking service such as Sentry).
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="auth-layout">
          <ErrorState
            message="An unexpected error occurred. Reloading the page usually fixes it."
            onRetry={() => window.location.reload()}
          />
        </main>
      );
    }
    return this.props.children;
  }
}
