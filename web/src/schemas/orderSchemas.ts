import { z } from "zod";
import { numberField } from "@/lib/zodHelpers";

// ---- API responses (validated by apiFetch) ----
// Matches api/src/modules/orders/orders.repository.ts `Order`. If the backend changes the shape,
// parsing fails loudly in apiFetch instead of rendering "NaN" or "undefined" in the UI.
export const orderSchema = z.object({
  id: z.number(),
  userId: z.number(),
  productName: z.string(),
  quantity: z.number(),
  price: z.number(),
  orderDate: z.string(), // ISO-8601
});
export type Order = z.infer<typeof orderSchema>;

// List envelope: { data, total, limit, offset } (see orders.service.ts listOrders).
export const ordersPageSchema = z.object({
  data: z.array(orderSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});
export type OrdersPage = z.infer<typeof ordersPageSchema>;

// ---- Form ----
// NOTE: no userId. The server decides the owner from the login cookie; the client is never asked.
export const orderFormSchema = z.object({
  productName: z.string().trim().min(1, "Product name is required").max(100, "Max 100 characters"),
  quantity: numberField("Quantity")
    .int("Quantity must be a whole number")
    .positive("Quantity must be at least 1")
    .max(2147483647, "Quantity is too large"),
  price: numberField("Price")
    .positive("Price must be greater than 0")
    .max(99999999.99, "Price is too large")
    // 19.99 * 100 is 1998.9999999999998 in JS floating point, so compare with a tiny tolerance.
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, "At most 2 decimal places"),
});
export type OrderFormValues = z.infer<typeof orderFormSchema>;

// Names of the form's fields, used to route server-side field errors to inputs (lib/formErrors.ts).
export const ORDER_FORM_FIELDS = ["productName", "quantity", "price"] as const;
