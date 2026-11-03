import { Link } from "react-router";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageSpinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { useOrders } from "@/hooks/useOrders";

// Landing page after login: a greeting, one headline number, and the 5 most recent orders.
// It only READS data through the orders feature's public hook. It never reaches into that feature's
// api/keys files - features talk to each other through hooks/components, which keeps the boundaries clean
// (and keeps them extractable if a feature becomes its own app/service later).
export default function Dashboard() {
  const { user } = useAuth();
  const recent = useOrders({ limit: 5, offset: 0 });

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Welcome{user ? `, ${user.name}` : ""}</h1>
        <Link to="/orders/new" className="btn-primary">
          New order
        </Link>
      </div>

      {recent.isPending && <PageSpinner />}
      {recent.isError && (
        <ErrorState message="We couldn't load your orders." onRetry={() => void recent.refetch()} />
      )}

      {recent.data && (
        <>
          <div className="stat-grid">
            <div className="card">
              <p className="text-muted">Total orders</p>
              <p className="stat-value">{recent.data.total}</p>
            </div>
          </div>

          <div className="card">
            <h2>Recent orders</h2>
            {recent.data.data.length === 0 ? (
              <p className="text-muted">Nothing here yet. Create your first order.</p>
            ) : (
              <>
                <OrdersTable orders={recent.data.data} />
                <div className="pagination">
                  <Link to="/orders">View all orders</Link>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
