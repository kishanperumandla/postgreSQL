import { apiFetch } from "@/lib/apiClient";
import {
  orderSchema,
  ordersPageSchema,
  type Order,
  type OrderFormValues,
  type OrdersPage,
} from "@/schemas/orderSchemas";

// Paging parameters for the list endpoint (also used to build cache keys in services/queryKeys.ts).
export type OrdersListParams = { limit: number; offset: number };

// API LAYER for orders (same rules as authService.ts: plain functions, no React).
// This file is the unit that maps to the future "orders" microservice.
// Note what is absent: no user id anywhere. The server knows who is calling from the login cookie.

export function fetchOrders(params: OrdersListParams, signal?: AbortSignal): Promise<OrdersPage> {
  const query = new URLSearchParams({ limit: String(params.limit), offset: String(params.offset) });
  return apiFetch(`/orders?${query}`, { schema: ordersPageSchema, signal });
}

export function fetchOrder(id: number, signal?: AbortSignal): Promise<Order> {
  return apiFetch(`/orders/${id}`, { schema: orderSchema, signal });
}

export function createOrder(values: OrderFormValues): Promise<Order> {
  return apiFetch("/orders", { method: "POST", body: values, schema: orderSchema });
}

export function updateOrder(id: number, values: OrderFormValues): Promise<Order> {
  return apiFetch(`/orders/${id}`, { method: "PATCH", body: values, schema: orderSchema });
}

export function deleteOrder(id: number): Promise<void> {
  return apiFetch(`/orders/${id}`, { method: "DELETE" });
}
