import { Router } from "express";
import { pool } from "../db";

export const usersRouter = Router();

usersRouter.get("/", async (_req, res, next) => {
  try {
    const result = await pool.query("SELECT id, name, email FROM users ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});
