import type { ReactNode } from "react";
import { Button } from "./Button";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void; // when provided, shows a "Try again" button
  action?: ReactNode; // optional extra action, e.g. a link back to the list
};

// Full-section error screen for when a page's MAIN data failed to load.
// (Toasts are for transient events; a page that cannot render its content needs a visible, persistent state.)
export function ErrorState({ title = "Something went wrong", message, onRetry, action }: ErrorStateProps) {
  return (
    <div className="state-box card" role="alert">
      <h2>{title}</h2>
      <p className="text-muted">{message}</p>
      {onRetry && <Button onClick={onRetry}>Try again</Button>}
      {action}
    </div>
  );
}
