import { Router } from "express";
import { pool } from "../db";

import { z } from "zod";
import { hash } from "bcryptjs";

const idParamSchema = z.object({
  id: z.coerce.number().int().positive().max(2147483647),
});

const createUserSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().max(100),
  password: z.string().min(8).max(72),
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

// Get Users by Id
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

//  Create user
usersRouter.post("/", async (req, res, next) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid user data",
      details: z.flattenError(parsed.error).fieldErrors,
    });
    return;
  }

  const { name, email, password } = parsed.data;
  try {
    const passwordHash = await hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, passwordHash],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "23505") {
      res.status(409).json({ error: "Email already exists" });
      return;
    }
    next(err);
  }
});
