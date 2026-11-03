import { z } from "zod";

// SCHEMAS = the definition of what a valid request looks like. A controller calls
// `schema.parse(req.body)`; on bad input zod throws and errorHandler answers 400 with
// per-field messages. After parsing, the data is typed AND cleaned (trimmed, lower-cased).
//
// The frontend has its own matching schemas for instant form feedback, but those are only for
// user experience. These are the real rules, because anyone can bypass the browser with curl.

// Trim + lower-case BEFORE validating, so " Raman@Gmail.COM " and "raman@gmail.com" are the same account.
// (Order matters: validating the format first would reject the surrounding spaces.)
const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address").max(100));

// bcrypt only uses the first 72 BYTES of a password; anything longer is silently ignored
// (two long passwords sharing the first 72 bytes would be "equal"). We reject instead of truncating.
// Measured in bytes, not characters, because emoji/accents take several bytes each.
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Password is too long (max 72 bytes)");

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: emailSchema,
  password: passwordSchema,
});

// Login deliberately has NO strength rules: it only needs to accept whatever was set earlier
// (e.g. the original seed passwords). Rules belong at the moment a password is created.
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(200),
});

// Types derived from the schemas, so the TypeScript type and the runtime check can never drift apart.
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
