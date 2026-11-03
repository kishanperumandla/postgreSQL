import "dotenv/config";
import cors from "cors";
import express from "express";
import { pool } from "./db";
import { usersRouter } from "./routes/users";
import { ordersRouter } from "./routes/orders";
const app = express();
const port = Number(process.env.PORT) || 3000;
import { errorHandler, notFound } from "./middleware/errorHandler";

app.disable("x-powered-by");

app.use(cors());
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "up" });
  } catch (err) {
    console.error(err);
    res.status(503).json({ status: "error", db: "down" });
  }
});

app.use("/users", usersRouter);
app.use("/orders", ordersRouter);

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});

app.use(notFound);
app.use(errorHandler);
