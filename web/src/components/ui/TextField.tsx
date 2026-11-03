import { useId, type ComponentProps } from "react";

type TextFieldProps = ComponentProps<"input"> & {
  label: string;
  error?: string; // message from React Hook Form (client zod rule OR server field error)
};

// Label + input + error message as one unit, wired for accessibility:
//  - <label htmlFor> ties the label to the input (clicking the label focuses it; screen readers announce it)
//  - aria-invalid / aria-describedby let screen readers announce the error when the field is focused
//  - the red border in CSS is driven by aria-invalid, so what you SEE and what assistive tech HEARS can't disagree
// React 19 passes `ref` as a normal prop, which is how React Hook Form's register() reaches the real <input>.
export function TextField({ label, error, id, className, ...inputProps }: TextFieldProps) {
  const generatedId = useId(); // unique per instance, so two fields can never share an id
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="form-field">
      <label className="form-label" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className={["form-input", className ?? ""].filter(Boolean).join(" ")}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error && (
        // role="alert" makes screen readers announce the message the moment it appears.
        <p id={errorId} className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
