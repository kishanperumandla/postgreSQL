import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useAuth } from "@/hooks/useAuth";
import { loginFormSchema, type LoginFormValues } from "@/schemas/authSchemas";

export default function Login() {
  const { login, isLoggingIn } = useAuth();

  // React Hook Form manages the form state. `zodResolver` plugs our zod schema in as the validator:
  // on submit (and then on every change) each field is checked and errors land in formState.errors.
  // Forms are "uncontrolled" (register() attaches to the real <input>), so typing doesn't re-render the page.
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  // handleSubmit only calls this when validation passes, so `values` is already typed and trimmed.
  // On success there is nothing to do here: AuthProvider stores the user, and UnAuthenticatedLayout redirects.
  // On failure the global handler (queryClient.ts) shows a toast such as "Incorrect email or password."
  const onSubmit = (values: LoginFormValues) => login(values);

  return (
    <>
      <h1 className="auth-title">Log in</h1>
      {/* noValidate: turn off the browser's own bubbles so ONLY our zod messages appear, consistently. */}
      <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          label="Email"
          type="email"
          autoComplete="email" // lets password managers / browsers autofill correctly
          error={errors.email?.message}
          {...register("email")}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Button type="submit" loading={isLoggingIn}>
          Log in
        </Button>
      </form>
      <p className="auth-switch">
        No account yet? <Link to="/register">Create one</Link>
      </p>
    </>
  );
}
