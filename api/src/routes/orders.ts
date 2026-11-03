import { Router } from "express";
import { pool } from "../db";
import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

// Zod Schema
const orderSchema = z.object({
  user_id: z.number().int().positive().max(2147483647),
  product_name: z.string().trim().min(1, "Product Name is Required").max(100),
  quantity: z.number().int().positive().max(2147483647),
  price: z.number().positive().max(99999999.99),
});

const orderQuerySchema = z.object({
  user_id: z.coerce.number().int().positive().max(2147483647).optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

const orderIdParamSchema = z.object({ id: z.coerce.number().int().positive().max(2147483647) });

// Router
export const ordersRouter = Router();

ordersRouter.post("/", createOrder);

ordersRouter.get("/", getOrders);

ordersRouter.get("/:id", getOrder);

// Create Order
async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = orderSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid order data",
        details: z.flattenError(parsed.error).fieldErrors,
      });
      return;
    }
    const { user_id, product_name, quantity, price } = parsed.data;

    const result = await pool.query(
      "INSERT INTO orders ( user_id, product_name, quantity, price) VALUES($1, $2, $3, $4) RETURNING *",
      [user_id, product_name, quantity, price],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "23503") {
      res.status(400).json({ error: "User does not exist" });
      return;
    }
    next(err);
  }
}

// Get orders (optional filters: ?user_id=, paging: ?limit=&offset=)
async function getOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = orderQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid query",
        details: z.flattenError(parsed.error).fieldErrors,
      });
      return;
    }

    let query = "SELECT id, user_id, product_name, quantity, price, order_date FROM orders";
    const values: unknown[] = [];

    if (parsed.data.user_id !== undefined) {
      values.push(parsed.data.user_id);
      query = `${query} WHERE user_id = $${values.length}`;
    }

    values.push(parsed.data.limit, parsed.data.offset);
    query = `${query} ORDER BY id LIMIT $${values.length - 1} OFFSET $${values.length}`;

    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
}

// Get one order by id
async function getOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = orderIdParamSchema.safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid id",
        details: z.flattenError(parsed.error).fieldErrors,
      });
      return;
    }

    const result = await pool.query(
      "SELECT id, user_id, product_name, quantity, price, order_date FROM orders WHERE id=$1",
      [parsed.data.id],
    );
    if (!result.rows[0]) {
      res.status(404).json({
        error: "Order not found",
      });
      return;
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}
