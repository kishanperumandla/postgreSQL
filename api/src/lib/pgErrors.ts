// PostgreSQL reports constraint failures with a 5-character SQLSTATE code on the error object.
// Naming them here avoids "magic strings" like "23505" scattered through the code.
export const PG_UNIQUE_VIOLATION = "23505"; // e.g. a second user with the same email
export const PG_FOREIGN_KEY_VIOLATION = "23503"; // e.g. an order pointing at a user that doesn't exist

// Type guard: lets TypeScript know `err.code` exists after the check (pg errors are plain Errors).
export function isPgError(err: unknown, code: string): boolean {
  return err instanceof Error && "code" in err && err.code === code;
}
