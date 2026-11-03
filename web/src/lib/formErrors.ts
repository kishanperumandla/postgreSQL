import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { isApiError } from "./apiError";

// Copies the backend's per-field validation messages onto the matching form inputs.
//
// The frontend zod schema catches most mistakes before sending. But the server is the authority:
// it may reject something the browser let through (rules changed, a race, a different client).
// Without this, the user would only see a generic toast and no indication WHICH field is wrong.
//
// Usage:  mutation.mutate(values, { onError: (err) => applyServerFieldErrors(err, form.setError) })
export function applyServerFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  knownFields: readonly string[],
): void {
  if (!isApiError(error) || error.code !== "VALIDATION_ERROR") return;

  for (const [field, messages] of Object.entries(error.details?.fieldErrors ?? {})) {
    const message = messages[0];
    // Ignore fields this form doesn't have (e.g. the API validated something we don't render).
    if (message && knownFields.includes(field)) {
      setError(field as Path<T>, { type: "server", message });
    }
  }
}
