import { Router } from "express";
import { pool } from "../db";

import { z } from "zod";

const idParamSchema = z.object({
  id: z.coerce.number().int().positive().max(2147483647),
});

export const usersRouter = Router();

// Get all Users
usersRouter.get("/", async (_req, res, next) => {
  try {
    const result = await pool.query("SELECT id, name, email FROM users ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// Get USers by Id
usersRouter.get("/:id", async (req, res, next) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  try {
    const result = await pool.query("SELECT id, name, email FROM users WHERE id = $1", [parsed.data.id]);
    const user = result.rows[0];
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});
