import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { applyServerFieldErrors } from "@/lib/formErrors";
import { useRegister } from "@/hooks/useRegister";
import { registerFormSchema, type RegisterFormValues } from "@/schemas/authSchemas";

const FIELDS = ["name", "email", "password"] as const;

export default function Register() {
  const registerUser = useRegister();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = ({ name, email, password }: RegisterFormValues) => {
    // confirmPassword was only for the UI check; it is deliberately not sent to the API.
    registerUser.mutate(
      { name, email, password },
      {
        // Per-call callbacks run in addition to the hook's own onSuccess (the success toast).
        onSuccess: () => void navigate("/login", { replace: true }),
        // If the server rejects a field (e.g. its rules differ from ours), show it on that input.
        // The generic toast ("Please check the highlighted fields.") comes from the global handler.
        onError: (error) => applyServerFieldErrors(error, setError, FIELDS),
      },
    );
  };

  return (
    <>
      <h1 className="auth-title">Create account</h1>
      <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField label="Name" autoComplete="name" error={errors.name?.message} {...register("name")} />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password" // tells password managers to offer a NEW strong password
          error={errors.password?.message}
          {...register("password")}
        />
        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" loading={registerUser.isPending}>
          Create account
        </Button>
      </form>
      <p className="auth-switch">
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </>
  );
}
