import { pool } from "../../db";
import type { CreateOrderInput, UpdateOrderInput } from "./orders.schemas";

// REPOSITORY: all SQL for orders. Two rules in this file:
//  1. Values ALWAYS travel in the parameter array ($1, $2 ...), never concatenated into the SQL
//     string. This is what prevents SQL injection.
//  2. Every query that touches ONE order also filters by user_id. Ownership is enforced in the
//     database query itself, so no code path can forget a separate "is this yours?" check.

// The API contract (camelCase, price as a number) - what clients receive.
export type Order = {
  id: number;
  userId: number;
  productName: string;
  quantity: number;
  price: number;
  orderDate: string; // ISO-8601
};

// The row exactly as pg returns it. Note: pg returns DECIMAL as a STRING (to avoid losing
// precision in JS floats) and timestamps as Date.
type OrderRow = {
  id: number;
  user_id: number;
  product_name: string;
  quantity: number;
  price: string;
  order_date: Date;
};

// Reused in every query so all of them return the same columns (and never "SELECT *",
// which would start leaking any column added to the table later).
const COLUMNS = "id, user_id, product_name, quantity, price, order_date";

// Database shape -> API shape, in ONE place. If a column is renamed, or this table moves to
// another service, the HTTP contract stays the same and the frontend doesn't change.
// Number("19.99") is safe here: the column is DECIMAL(10,2), at most 10 digits, well within
// double precision. (For arbitrary-precision money you'd keep strings or integer cents.)
function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    userId: row.user_id,
    productName: row.product_name,
    quantity: row.quantity,
    price: Number(row.price),
    orderDate: row.order_date.toISOString(),
  };
}

export async function insert(userId: number, input: CreateOrderInput): Promise<Order> {
  const result = await pool.query<OrderRow>(
    `INSERT INTO orders (user_id, product_name, quantity, price)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUMNS}`,
    [userId, input.productName, input.quantity, input.price],
  );
  const row = result.rows[0];
  if (!row) throw new Error("INSERT INTO orders returned no row");
  return toOrder(row);
}

export async function findByIdForUser(id: number, userId: number): Promise<Order | null> {
  const result = await pool.query<OrderRow>(
    `SELECT ${COLUMNS} FROM orders WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  const row = result.rows[0];
  return row ? toOrder(row) : null;
}

// One page of the user's orders (newest first) plus the total, so the UI can draw pagination.
// The two queries are independent, so they run in parallel.
export async function listByUser(
  userId: number,
  page: { limit: number; offset: number },
): Promise<{ rows: Order[]; total: number }> {
  const [list, count] = await Promise.all([
    pool.query<OrderRow>(
      `SELECT ${COLUMNS} FROM orders WHERE user_id = $1 ORDER BY id DESC LIMIT $2 OFFSET $3`,
      [userId, page.limit, page.offset],
    ),
    pool.query<{ total: string }>("SELECT COUNT(*) AS total FROM orders WHERE user_id = $1", [userId]),
  ]);
  return {
    rows: list.rows.map(toOrder),
    // COUNT(*) is a bigint, which pg also returns as a string.
    total: Number(count.rows[0]?.total ?? 0),
  };
}

// Maps API field names to real column names. Only these three can ever be updated.
// Column names are inserted into the SQL text, which is only safe because they come from THIS
// fixed list - never from the request. (Values still go through $n parameters.)
const UPDATABLE_COLUMNS = {
  productName: "product_name",
  quantity: "quantity",
  price: "price",
} as const;

export async function updateForUser(id: number, userId: number, patch: UpdateOrderInput): Promise<Order | null> {
  const assignments: string[] = [];
  const values: unknown[] = [];

  for (const [field, column] of Object.entries(UPDATABLE_COLUMNS) as [keyof typeof UPDATABLE_COLUMNS, string][]) {
    const value = patch[field];
    if (value !== undefined) {
      values.push(value);
      assignments.push(`${column} = $${values.length}`); // placeholder number derived from the array length
    }
  }

  // The schema guarantees at least one field; this protects against a caller bypassing it,
  // since `UPDATE orders SET WHERE ...` would be invalid SQL.
  if (assignments.length === 0) return findByIdForUser(id, userId);

  values.push(id, userId);
  const result = await pool.query<OrderRow>(
    `UPDATE orders SET ${assignments.join(", ")}
     WHERE id = $${values.length - 1} AND user_id = $${values.length}
     RETURNING ${COLUMNS}`,
    values,
  );
  const row = result.rows[0];
  return row ? toOrder(row) : null;
}

// Returns true if a row was deleted. `rowCount` is 0 when the id doesn't exist OR belongs to another user.
export async function deleteForUser(id: number, userId: number): Promise<boolean> {
  const result = await pool.query("DELETE FROM orders WHERE id = $1 AND user_id = $2", [id, userId]);
  return (result.rowCount ?? 0) > 0;
}
