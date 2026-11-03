import { Link } from "react-router";
import { Button } from "@/components/ui/Button";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { Order } from "@/schemas/orderSchemas";

type OrdersTableProps = {
  orders: Order[];
  // When provided, each row gets Edit / Delete actions. The dashboard omits it for a read-only preview.
  onDelete?: (order: Order) => void;
};

// Presentational ("dumb") component: it only renders what it is given and reports clicks upward.
// It does NOT fetch or delete anything itself, so the same table works on the dashboard and the list page.
export function OrdersTable({ orders, onDelete }: OrdersTableProps) {
  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Product</th>
            <th className="table-number">Qty</th>
            <th className="table-number">Price</th>
            <th>Date</th>
            {onDelete && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            // `key` lets React match rows between renders (use the stable id, never the array index,
            // or deleting a row would re-use the wrong row's DOM/state).
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.productName}</td>
              <td className="table-number">{order.quantity}</td>
              <td className="table-number">{formatPrice(order.price)}</td>
              <td>{formatDateTime(order.orderDate)}</td>
              {onDelete && (
                <td>
                  <div className="table-actions">
                    <Link to={`/orders/${order.id}/edit`} className="btn-secondary btn-small">
                      Edit
                    </Link>
                    <Button variant="danger" small onClick={() => onDelete(order)}>
                      Delete
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
