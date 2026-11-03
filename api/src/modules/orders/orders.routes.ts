import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth";
import * as ordersController from "./orders.controller";

// Mounted at /api/v1/orders in app.ts.
export const ordersRouter = Router();

// ONE line protects every route below it, including any route added in the future.
// IF SKIPPED (or placed after the routes): the endpoints are public, `currentUserId()` throws
// 401 anyway as a safety net, but the intent is that unauthenticated requests never reach a controller.
ordersRouter.use(requireAuth);

ordersRouter.post("/", ordersController.createOrder);
ordersRouter.get("/", ordersController.listOrders);
ordersRouter.get("/:id", ordersController.getOrder);
ordersRouter.patch("/:id", ordersController.updateOrder);
ordersRouter.delete("/:id", ordersController.deleteOrder);
