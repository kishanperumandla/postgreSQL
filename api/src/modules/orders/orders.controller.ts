import type { Request, Response } from "express";
import { currentUserId } from "../../middleware/requireAuth";
import {
  createOrderSchema,
  listOrdersQuerySchema,
  orderIdParamsSchema,
  updateOrderSchema,
} from "./orders.schemas";
import * as ordersService from "./orders.service";

// Controllers: parse input -> call service with the AUTHENTICATED user id -> pick status + body.
// `currentUserId(req)` is the single source of ownership. Nothing here reads a user id from
// the body, query or URL.

// POST /orders
export async function createOrder(req: Request, res: Response) {
  const input = createOrderSchema.parse(req.body);
  const order = await ordersService.createOrder(currentUserId(req), input);
  res.status(201).json(order);
}

// GET /orders?limit=&offset=     -> only the caller's orders
export async function listOrders(req: Request, res: Response) {
  const query = listOrdersQuerySchema.parse(req.query);
  res.status(200).json(await ordersService.listOrders(currentUserId(req), query));
}

// GET /orders/:id
export async function getOrder(req: Request, res: Response) {
  const { id } = orderIdParamsSchema.parse(req.params);
  res.status(200).json(await ordersService.getOrder(currentUserId(req), id));
}

// PATCH /orders/:id
export async function updateOrder(req: Request, res: Response) {
  const { id } = orderIdParamsSchema.parse(req.params);
  const patch = updateOrderSchema.parse(req.body);
  res.status(200).json(await ordersService.updateOrder(currentUserId(req), id, patch));
}

// DELETE /orders/:id
export async function deleteOrder(req: Request, res: Response) {
  const { id } = orderIdParamsSchema.parse(req.params);
  await ordersService.deleteOrder(currentUserId(req), id);
  res.status(204).send(); // 204 No Content: success, nothing to return
}
