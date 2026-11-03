import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormSetError } from "react-hook-form";
import { Link } from "react-router";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { orderFormSchema, type OrderFormValues } from "@/schemas/orderSchemas";

type OrderFormProps = {
  defaultValues?: OrderFormValues;
  submitLabel: string;
  isSubmitting: boolean;
  // The parent owns the mutation. It receives `setError` so it can place SERVER validation messages on fields.
  onSubmit: (values: OrderFormValues, setError: UseFormSetError<OrderFormValues>) => void;
};

// One form for BOTH create and edit - the only differences are the initial values and the button label.
// Two near-identical forms would drift apart (a rule fixed in one, forgotten in the other).
export function OrderForm({ defaultValues, submitLabel, isSubmitting, onSubmit }: OrderFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues,
  });

  return (
    <form className="form" onSubmit={handleSubmit((values) => onSubmit(values, setError))} noValidate>
      <TextField label="Product name" error={errors.productName?.message} {...register("productName")} />
      <TextField
        label="Quantity"
        type="number"
        inputMode="numeric"
        min={1}
        step={1}
        error={errors.quantity?.message}
        // valueAsNumber: an <input> always yields a STRING ("2"). This makes React Hook Form hand the schema
        // a real number (and NaN when empty). IF OMITTED, zod would reject every value as "not a number".
        {...register("quantity", { valueAsNumber: true })}
      />
      <TextField
        label="Price (USD)"
        type="number"
        inputMode="decimal"
        min={0.01}
        step={0.01}
        error={errors.price?.message}
        {...register("price", { valueAsNumber: true })}
      />
      <div className="form-actions">
        <Link to="/orders" className="btn-secondary">
          Cancel
        </Link>
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
