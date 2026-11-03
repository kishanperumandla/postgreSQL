import { createContext } from "react";
import type { LoginFormValues, User } from "@/schemas/authSchemas";

// The context OBJECT and its value type, kept apart from the AuthProvider component (contexts/authContext.tsx).
// Why a separate file: React's "fast refresh" (instant updates while you edit in `npm run dev`) only works for files
// that export nothing but components; mixing a context object into the provider file makes edits force a full reload.

export type AuthContextValue = {
  user: User | null; // null = logged out
  isLoading: boolean; // true only during the very first "am I logged in?" check
  isError: boolean; // that first check failed (server unreachable) - NOT the same as "logged out"
  refetch: () => void;
  login: (values: LoginFormValues) => void;
  isLoggingIn: boolean;
  logout: () => void;
  isLoggingOut: boolean;
};

// `null` default = "no provider above this component"; useAuth() turns that into a clear error.
export const AuthContext = createContext<AuthContextValue | null>(null);
