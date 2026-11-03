import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import * as authService from "@/services/authService";

// Registration is not part of AuthContext: it doesn't change who is logged in (the API doesn't start a session on
// register), so only the Register page needs it. Keep context for state many components share.
export function useRegister() {
  return useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      // The page then sends the user to /login.
      toast.success("Account created! Please log in.");
    },
  });
}
