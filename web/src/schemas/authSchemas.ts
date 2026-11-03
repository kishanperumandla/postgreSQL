import { z } from "zod";

// Two kinds of schema live here:
//  1. RESPONSE schemas  - what the API returns; apiFetch validates responses against them.
//  2. FORM schemas      - what the user may submit; React Hook Form runs them on every field for instant feedback.
//
// Form schemas are for user experience ONLY. The backend re-validates everything (auth.schemas.ts) because
// anyone can bypass the browser with curl. Keep the rules in sync, but never rely on this layer for security.

// ---- API responses ----
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
});
export type User = z.infer<typeof userSchema>;

// Login/register/me all answer { user: {...} }.
export const userResponseSchema = z.object({ user: userSchema });

// ---- Forms ----
const emailField = z.string().trim().min(1, "Email is required").pipe(z.email("Enter a valid email address"));

export const loginFormSchema = z.object({
  email: emailField,
  // No strength rules on login: it only needs to accept whatever was set at registration.
  password: z.string().min(1, "Password is required"),
});
export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const registerFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
    email: emailField,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      // Mirrors the backend: bcrypt only uses the first 72 BYTES, so longer passwords are rejected.
      .refine((value) => new TextEncoder().encode(value).length <= 72, "Password is too long (max 72 bytes)"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  // Cross-field rule: attach the error to confirmPassword so it appears under that input.
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type RegisterFormValues = z.infer<typeof registerFormSchema>;

// What is actually sent to the API: confirmPassword is a UI-only field and is never sent.
export type RegisterPayload = Pick<RegisterFormValues, "name" | "email" | "password">;
