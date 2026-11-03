import { useEffect, useRef } from "react";
import { Button } from "./Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean; // true while the confirmed action is running
  onConfirm: () => void;
  onCancel: () => void;
};

// "Are you sure?" dialog for destructive actions (delete). Built on the browser's native <dialog>:
// showModal() provides, with no extra code or library, a dimmed backdrop, keyboard focus trapped
// inside, Esc to close, and the page behind made inert. Hand-rolled modals usually miss at least one
// of those (typically focus trapping), which makes them unusable by keyboard/screen-reader users.
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // The `open` prop (React state) is the source of truth; this effect makes the DOM element follow it.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby="confirm-dialog-title"
      // Fires when the user presses Esc. preventDefault stops the browser closing it by itself; we
      // tell the parent, which flips `open` to false. This keeps React state and the DOM in sync.
      onCancel={(event) => {
        event.preventDefault();
        if (!loading) onCancel();
      }}
    >
      <h2 id="confirm-dialog-title" className="modal-title">
        {title}
      </h2>
      <p>{message}</p>
      <div className="modal-actions">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
