import { useContext } from "react";
import { AuthContext } from "@/contexts/authContextBase";

// The way components read auth state:  const { user, login, logout } = useAuth();
// The check below turns a hard-to-debug problem (user is mysteriously always "undefined") into an immediate,
// clear error if someone renders a component outside <AuthProvider>.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
