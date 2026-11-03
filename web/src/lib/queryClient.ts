import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isApiError } from "@/lib/apiError";
import { getUserMessage, notifyError } from "@/lib/errorMessages";
import { authKeys, ordersKeys } from "@/services/queryKeys";

// THE ONE QueryClient: owns the cache of all server data, plus app-wide fetching rules.

// Forget everything cached about the previous user (orders...) but KEEP the auth entry itself.
// Used on login and logout, so one person's data can never show up for the next person on the same browser.
//
// Why not queryClient.clear()? clear() deletes EVERY entry, including `auth/me`, which AuthProvider is still
// subscribed to. The subscriber is left attached to a deleted entry, so the later setQueryData(me, ...) doesn't
// reach it and the UI can keep showing the old user. Removing only the non-auth entries avoids that trap.
export function clearCachedUserData(client: QueryClient): void {
  client.removeQueries({ predicate: (query) => query.queryKey[0] !== authKeys.me[0] });
}

// Runs for EVERY failed query and mutation in the app. This is the centralised error handling:
// components don't write their own try/catch + toast. (They only handle things specific to them,
// e.g. putting server validation messages next to form fields.)
function handleGlobalError(error: unknown, meta: Record<string, unknown> | undefined) {
  // The server says our login is no longer valid (cookie expired/tampered, account deleted).
  // Forget the user: AuthenticatedLayout notices `me` is null and redirects to /login. We only toast if there WAS
  // a session, so five parallel requests failing together produce one toast, not five.
  // (INVALID_CREDENTIALS - a wrong password on the login form - is a different code and is handled normally.)
  if (isApiError(error) && error.code === "UNAUTHENTICATED") {
    const hadSession = queryClient.getQueryData(authKeys.me) != null;
    queryClient.setQueryData(authKeys.me, null);
    queryClient.removeQueries({ queryKey: ordersKeys.all });
    if (hadSession) toast.error(getUserMessage(error));
    return;
  }

  // Queries/mutations that render their own error UI opt out with `meta: { silent: true }`.
  if (meta?.silent === true) return;

  notifyError(error);
}

// Which failures are worth retrying automatically?
//  - 4xx (bad input, not found, unauthenticated): the same request will fail the same way. Don't retry.
//  - network errors and 5xx: often transient (server restarting). Retry up to 2 times with backoff.
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}

export const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => handleGlobalError(error, query.meta),
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _onMutateResult, mutation) => handleGlobalError(error, mutation.meta),
  }),
  defaultOptions: {
    queries: {
      // Data is "fresh" for 30 s: navigating between pages re-uses the cache instead of re-requesting.
      staleTime: 30_000,
      retry: shouldRetry,
    },
    // Never auto-retry writes: repeating a POST could create a duplicate order.
    mutations: { retry: false },
  },
});
