import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageSpinner } from "@/components/ui/Spinner";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { useDeleteOrder, useOrders } from "@/hooks/useOrders";
import type { Order } from "@/schemas/orderSchemas";

const PAGE_SIZE = 10;

export default function OrdersList() {
  // The current page lives in the URL (?page=2), not in useState:
  //  - refresh keeps your place, and the Back button works
  //  - a page can be bookmarked or shared as a link
  // IF IT WERE useState: every refresh would jump back to page 1.
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedPage = Number(searchParams.get("page"));
  const page = Number.isInteger(requestedPage) && requestedPage >= 1 ? requestedPage : 1; // "?page=abc" -> 1

  const orders = useOrders({ limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const deleteOrder = useDeleteOrder();
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const total = orders.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // If the current page no longer exists (e.g. we deleted the last row of the last page, or the URL says
  // ?page=99), move to the last real page instead of showing an empty table.
  useEffect(() => {
    if (orders.data && page > totalPages) {
      setSearchParams({ page: String(totalPages) }, { replace: true });
    }
  }, [orders.data, page, totalPages, setSearchParams]);

  const goToPage = (next: number) => setSearchParams(next === 1 ? {} : { page: String(next) });

  const confirmDelete = () => {
    if (!orderToDelete) return;
    deleteOrder.mutate(orderToDelete.id, {
      // Close the dialog whether it worked or not; failures are reported by the global error toast.
      onSettled: () => setOrderToDelete(null),
    });
  };

  return (
    <>
      <div className="page-header">
        <h1>My orders</h1>
        <Link to="/orders/new" className="btn-primary">
          New order
        </Link>
      </div>

      {orders.isPending && <PageSpinner />}

      {orders.isError && (
        <ErrorState message="We couldn't load your orders." onRetry={() => void orders.refetch()} />
      )}

      {orders.data &&
        (orders.data.total === 0 ? (
          <div className="state-box card">
            <h2>No orders yet</h2>
            <p className="text-muted">Create your first order to see it here.</p>
            <Link to="/orders/new" className="btn-primary">
              Create an order
            </Link>
          </div>
        ) : (
          <div className="card">
            <OrdersTable orders={orders.data.data} onDelete={setOrderToDelete} />
            <div className="pagination">
              <span className="text-muted">
                Page {page} of {totalPages} · {total} orders
              </span>
              <Button variant="secondary" small disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                Previous
              </Button>
              <Button
                variant="secondary"
                small
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ))}

      <ConfirmDialog
        open={orderToDelete !== null}
        title="Delete order?"
        message={`Order #${orderToDelete?.id ?? ""} (${orderToDelete?.productName ?? ""}) will be permanently deleted.`}
        confirmLabel="Delete"
        loading={deleteOrder.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setOrderToDelete(null)}
      />
    </>
  );
}
