import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import { toast } from "sonner";
import { clearCachedUserData } from "@/lib/queryClient";
import * as authService from "@/services/authService";
import { authKeys } from "@/services/queryKeys";
import { AuthContext, type AuthContextValue } from "./authContextBase";

// AUTH CONTEXT: makes "who is logged in" available to any component via useAuth() (hooks/useAuth.ts),
// without passing props down. Mounted once in main.tsx, around <App />.
//
// DESIGN: the context does NOT keep its own copy of the user. The single source of truth is the TanStack
// Query cache (key authKeys.me); this provider just reads it and wraps login/logout. Two copies (a useState
// plus the server data) would drift apart: e.g. the global 401 handler in lib/queryClient.ts clears the cache
// when a session expires, and a separate useState would keep showing a logged-in user.

export default function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Ask the API who we are (the browser sends the httpOnly cookie automatically).
  const me = useQuery({
    queryKey: authKeys.me,
    queryFn: authService.fetchMe,
    staleTime: 5 * 60_000, // re-check at most every 5 min (it is also re-checked after any 401)
    // meta.silent: no global error toast for this query; the layouts render their own "can't verify your
    // session" screen, and a toast on top would be noise.
    meta: { silent: true },
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (user) => {
      // Drop anything cached for a previous user BEFORE storing the new one. Otherwise, if A's session expired
      // and B logs in on the same browser, B could briefly see A's cached orders.
      clearCachedUserData(queryClient);
      // Storing the user in the cache is what "logs in" the UI: UnAuthenticatedLayout notices and redirects
      // into the app, so no manual navigate() is needed.
      queryClient.setQueryData(authKeys.me, user);
      toast.success(`Welcome back, ${user.name}!`);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      toast.success("You have been logged out.");
    },
    // onSettled (runs on success AND failure): even if the request failed (e.g. offline) we still drop the local
    // session, so the user isn't stuck looking logged in. The cookie then simply expires on its own.
    onSettled: () => {
      clearCachedUserData(queryClient); // the next person using this browser must not see these orders
      queryClient.setQueryData(authKeys.me, null); // AuthenticatedLayout now redirects to /login
    },
  });

  // useMemo: components read this object from context. A new object on every render would re-render ALL of
  // them every time the provider renders; memoising it limits re-renders to when something really changed.
  const value = useMemo<AuthContextValue>(
    () => ({
      user: me.data ?? null,
      isLoading: me.isPending,
      // `data === undefined` matters: a failed BACKGROUND refresh keeps the previous data, and a user who is
      // known to be logged in must not be thrown to an error screen by one flaky refetch.
      isError: me.isError && me.data === undefined,
      refetch: () => void me.refetch(),
      login: (values) => loginMutation.mutate(values),
      isLoggingIn: loginMutation.isPending,
      logout: () => logoutMutation.mutate(),
      isLoggingOut: logoutMutation.isPending,
    }),
    [me, loginMutation, logoutMutation],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
