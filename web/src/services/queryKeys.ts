import type { OrdersListParams } from "./ordersService";

// TanStack Query CACHE KEYS for the whole app, in one file. A key is a cache entry's identity:
// same key = same cached data. Keeping them here (not scattered in hooks) means a typo can't silently
// create a second cache entry, and invalidating "everything about orders" is one obvious import.

export const authKeys = {
  me: ["auth", "me"] as const, // the logged-in user, or null when logged out
};

// Hierarchy for orders:
//   ["orders"]                               <- everything about orders
//   ["orders", "list", { limit, offset }]    <- one page of the list
//   ["orders", "detail", 7]                  <- one order
// Invalidating the root key (`ordersKeys.all`) refetches every list and detail at once, which is exactly
// what we want after create/update/delete: any list that might now be out of date gets refreshed.
export const ordersKeys = {
  all: ["orders"] as const,
  list: (params: OrdersListParams) => [...ordersKeys.all, "list", params] as const,
  detail: (id: number) => [...ordersKeys.all, "detail", id] as const,
};
