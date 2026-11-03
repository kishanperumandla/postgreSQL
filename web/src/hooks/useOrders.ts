import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as ordersService from "@/services/ordersService";
import type { OrdersListParams } from "@/services/ordersService";
import { ordersKeys } from "@/services/queryKeys";
import type { OrderFormValues } from "@/schemas/orderSchemas";

// A page of the current user's orders.
export function useOrders(params: OrdersListParams) {
  return useQuery({
    queryKey: ordersKeys.list(params),
    queryFn: ({ signal }) => ordersService.fetchOrders(params, signal),
    // While page 2 loads, keep showing page 1 instead of flashing a spinner (smooth pagination).
    placeholderData: keepPreviousData,
  });
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: ordersKeys.detail(id),
    queryFn: ({ signal }) => ordersService.fetchOrder(id, signal),
    // The edit page renders its own "not found" state, so don't also pop a global toast.
    meta: { silent: true },
    // A 404 will not become a 200 by retrying; failing fast shows the message sooner.
    retry: false,
  });
}

// ---- Mutations ----
// After any write, invalidate ["orders"]: every cached list/detail is marked stale and active ones refetch.
// IF SKIPPED: the list would keep showing old data (a created order missing, a deleted one still there)
// until the user manually reloads the page.

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: OrderFormValues) => ordersService.createOrder(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ordersKeys.all });
      toast.success("Order created.");
    },
  });
}

export function useUpdateOrder(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: OrderFormValues) => ordersService.updateOrder(id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ordersKeys.all });
      toast.success("Order updated.");
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => ordersService.deleteOrder(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ordersKeys.all });
      toast.success("Order deleted.");
    },
  });
}
