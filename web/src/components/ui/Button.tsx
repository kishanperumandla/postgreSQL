import type { ComponentProps } from "react";
import { Spinner } from "./Spinner";

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "danger";
  small?: boolean;
  // While true: show a spinner and disable the button. Pass the mutation's `isPending`.
  loading?: boolean;
};

// The app's only button. Variants map to the global classes in styles/components/_buttons.scss.
export function Button({
  variant = "primary",
  small = false,
  loading = false,
  type = "button", // see below
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [`btn-${variant}`, small ? "btn-small" : "", className ?? ""].filter(Boolean).join(" ");

  return (
    // `type` defaults to "button" because the HTML default inside a <form> is "submit": a plain
    // "Cancel" button would otherwise submit the form. Submit buttons opt in with type="submit".
    //
    // `disabled={loading}`: IF OMITTED, an impatient double-click sends the request twice
    // (two identical orders). Disabling while pending is the simplest double-submit protection.
    <button type={type} className={classes} disabled={disabled || loading} {...rest}>
      {loading ? <Spinner /> : children}
    </button>
  );
}
