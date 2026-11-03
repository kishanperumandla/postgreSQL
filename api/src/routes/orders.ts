import { Router } from "express";
import { pool } from "../db";
import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

const orderSchema = z.object({
  user_id: z.number().int().positive().max(2147483647),
  product_name: z.string().trim().min(1, "Product Name is Required").max(100),
  quantity: z.number().int().positive().max(2147483647),
  price: z.number().positive().max(99999999.99),
});

const userIdQuerySchema = z.object({ user_id: z.coerce.number().int().positive().max(2147483647) });

export const ordersRouter = Router();

ordersRouter.post("/", createOrder);

ordersRouter.get("/", listOrdersByUser);

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

//List orders for a user
async function listOrdersByUser(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = userIdQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid query",
        details: z.flattenError(parsed.error).fieldErrors,
      });
      return;
    }

    const result = await pool.query(
      "SELECT id, user_id, product_name, quantity, price, order_date FROM orders WHERE user_id=$1 ORDER BY id ",
      [parsed.data.user_id],
    );

    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
}
