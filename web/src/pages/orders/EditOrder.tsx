import { Link, useNavigate, useParams } from "react-router";
import { z } from "zod";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageSpinner } from "@/components/ui/Spinner";
import { isApiError } from "@/lib/apiError";
import { applyServerFieldErrors } from "@/lib/formErrors";
import { OrderForm } from "@/components/orders/OrderForm";
import { useOrder, useUpdateOrder } from "@/hooks/useOrders";
import { ORDER_FORM_FIELDS } from "@/schemas/orderSchemas";

// URL params are always strings and user-editable ("/orders/abc/edit"), so validate before using them.
const idSchema = z.coerce.number().int().positive();

const backToList = (
  <Link to="/orders" className="btn-secondary">
    Back to orders
  </Link>
);

export default function EditOrder() {
  const params = useParams();
  const parsedId = idSchema.safeParse(params.id);
  // Hooks can't be called conditionally, so we always call them and pass a harmless id (0) when the URL is
  // invalid; the invalid case is rendered below, before any data from these hooks is used.
  const id = parsedId.success ? parsedId.data : 0;

  const order = useOrder(id);
  const updateOrder = useUpdateOrder(id);
  const navigate = useNavigate();

  if (!parsedId.success) {
    return <ErrorState title="Order not found" message="That order link isn't valid." action={backToList} />;
  }
  if (order.isPending) return <PageSpinner />;

  if (order.isError) {
    // 404 also covers "this order belongs to someone else" - the API deliberately doesn't distinguish.
    const notFound = isApiError(order.error) && order.error.status === 404;
    return (
      <ErrorState
        title={notFound ? "Order not found" : "Couldn't load the order"}
        message={notFound ? "It may have been deleted." : "Please try again."}
        onRetry={notFound ? undefined : () => void order.refetch()}
        action={backToList}
      />
    );
  }

  const { productName, quantity, price } = order.data;

  return (
    <>
      <div className="page-header">
        <h1>Edit order #{order.data.id}</h1>
      </div>
      <div className="card order-form-card">
        <OrderForm
          defaultValues={{ productName, quantity, price }}
          submitLabel="Save changes"
          isSubmitting={updateOrder.isPending}
          onSubmit={(values, setError) =>
            updateOrder.mutate(values, {
              onSuccess: () => void navigate("/orders"),
              onError: (error) => applyServerFieldErrors(error, setError, ORDER_FORM_FIELDS),
            })
          }
        />
      </div>
    </>
  );
}
