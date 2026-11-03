import { useNavigate } from "react-router";
import { applyServerFieldErrors } from "@/lib/formErrors";
import { OrderForm } from "@/components/orders/OrderForm";
import { useCreateOrder } from "@/hooks/useOrders";
import { ORDER_FORM_FIELDS } from "@/schemas/orderSchemas";

export default function CreateOrder() {
  const createOrder = useCreateOrder();
  const navigate = useNavigate();

  return (
    <>
      <div className="page-header">
        <h1>New order</h1>
      </div>
      <div className="card order-form-card">
        <OrderForm
          submitLabel="Create order"
          isSubmitting={createOrder.isPending}
          onSubmit={(values, setError) =>
            createOrder.mutate(values, {
              // The order is created for whoever is logged in - the server reads that from the cookie.
              // Nothing identifying the user is sent from here.
              onSuccess: () => void navigate("/orders"),
              onError: (error) => applyServerFieldErrors(error, setError, ORDER_FORM_FIELDS),
            })
          }
        />
      </div>
    </>
  );
}
