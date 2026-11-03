import { describe, expect, it } from "vitest";
import { orderFormSchema } from "./orderSchemas";

const firstMessages = (input: unknown) => {
  const result = orderFormSchema.safeParse(input);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message]));
};

describe("orderFormSchema", () => {
  it("accepts a valid order and trims the product name", () => {
    const result = orderFormSchema.parse({ productName: "  Monitor ", quantity: 2, price: 19.99 });
    expect(result).toEqual({ productName: "Monitor", quantity: 2, price: 19.99 });
  });

  it("says 'required' for the NaN an empty number input produces", () => {
    expect(firstMessages({ productName: "x", quantity: NaN, price: NaN })).toEqual({
      quantity: "Quantity is required",
      price: "Price is required",
    });
  });

  it("gives each rule its own message (a zod 4 pitfall: one message used for every check)", () => {
    expect(firstMessages({ productName: "x", quantity: 0, price: 10 }).quantity).toBe(
      "Quantity must be at least 1",
    );
    expect(firstMessages({ productName: "x", quantity: 1.5, price: 10 }).quantity).toBe(
      "Quantity must be a whole number",
    );
  });

  it("allows 19.99 (floating-point safe) but rejects more than 2 decimals", () => {
    expect(orderFormSchema.safeParse({ productName: "x", quantity: 1, price: 19.99 }).success).toBe(true);
    expect(firstMessages({ productName: "x", quantity: 1, price: 10.999 }).price).toBe(
      "At most 2 decimal places",
    );
  });

  it("rejects an empty product name", () => {
    expect(firstMessages({ productName: "   ", quantity: 1, price: 1 }).productName).toBe(
      "Product name is required",
    );
  });
});
