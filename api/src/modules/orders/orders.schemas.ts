import { z } from "zod";

// Postgres INT max. Without an upper bound, a huge number passes validation and then fails in
// the database with an "integer out of range" error, which would surface as a confusing 500.
const MAX_INT = 2147483647;

// A number field whose custom message applies ONLY to "not a number" input (e.g. "abc" or null).
// Gotcha (zod 4): z.number("msg") would use "msg" for EVERY failure on the field - so quantity: 0
// would wrongly report "must be a number". Returning undefined falls back to each check's own message.
const numberField = (label: string) =>
  z.number({ error: (issue) => (issue.code === "invalid_type" ? `${label} must be a number` : undefined) });

// DECIMAL(10,2): at most 8 digits before the point and exactly 2 after.
const priceSchema = numberField("Price")
  .positive("Price must be greater than 0")
  .max(99999999.99, "Price is too large")
  // Reject 10.999 instead of letting Postgres silently round it to 11.00. The tiny tolerance
  // absorbs floating-point noise (19.99 * 100 is 1998.9999999999998 in JS).
  .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, "Price can have at most 2 decimals");

// NOTE: there is intentionally NO `userId` field here. zod strips unknown keys, so even if a
// client sends { "userId": 99 } it is discarded. The owner always comes from the login cookie
// (see orders.controller.ts). If this schema accepted userId, users could create orders for others.
export const createOrderSchema = z.object({
  productName: z.string().trim().min(1, "Product name is required").max(100),
  quantity: numberField("Quantity")
    .int("Quantity must be a whole number")
    .positive("Quantity must be at least 1")
    .max(MAX_INT, "Quantity is too large"),
  price: priceSchema,
});

// PATCH = partial update: send only the fields you want to change.
// The refine prevents an empty body `{}` from "succeeding" while changing nothing.
export const updateOrderSchema = createOrderSchema
  .partial()
  .refine((patch) => Object.values(patch).some((value) => value !== undefined), {
    message: "Provide at least one field to update",
  });

// Query-string values are always strings ("20"), hence z.coerce to turn them into numbers.
// The max limit caps how much data one request can pull, protecting the DB and the network.
export const listOrdersQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// :id from the URL, e.g. /orders/5 -> { id: "5" } -> 5. "abc" fails here -> 400, never reaches SQL.
export const orderIdParamsSchema = z.object({
  id: z.coerce.number().int().positive().max(MAX_INT),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
