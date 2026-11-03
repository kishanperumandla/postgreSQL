import { describe, expect, it } from "vitest";
import { loginFormSchema, registerFormSchema } from "./authSchemas";

const valid = {
  name: "Ada",
  email: "ada@example.com",
  password: "password123",
  confirmPassword: "password123",
};

// Small helper: run the schema and return { field: firstMessage } for failures.
function errorsOf(schema: typeof registerFormSchema | typeof loginFormSchema, input: unknown) {
  const result = schema.safeParse(input);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message]));
}

describe("registerFormSchema", () => {
  it("accepts valid input", () => {
    expect(registerFormSchema.safeParse(valid).success).toBe(true);
  });

  it("requires matching passwords and reports the error on confirmPassword", () => {
    expect(errorsOf(registerFormSchema, { ...valid, confirmPassword: "different" })).toEqual({
      confirmPassword: "Passwords do not match",
    });
  });

  it("rejects short passwords and bad emails", () => {
    const errors = errorsOf(registerFormSchema, {
      ...valid,
      email: "nope",
      password: "short",
      confirmPassword: "short",
    });
    expect(errors.email).toBe("Enter a valid email address");
    expect(errors.password).toMatch(/at least 8/);
  });

  it("rejects passwords over bcrypt's 72-byte limit (counted in bytes, not characters)", () => {
    const long = "é".repeat(40); // 40 characters but 80 bytes
    expect(
      errorsOf(registerFormSchema, { ...valid, password: long, confirmPassword: long }).password,
    ).toMatch(/too long/);
  });
});

describe("loginFormSchema", () => {
  it("does not apply password-strength rules at login", () => {
    expect(loginFormSchema.safeParse({ email: "a@b.co", password: "abc@123" }).success).toBe(true);
  });

  it("requires both fields", () => {
    expect(errorsOf(loginFormSchema, { email: "", password: "" })).toMatchObject({
      email: "Email is required",
      password: "Password is required",
    });
  });
});
