import { AppError } from "../../lib/errors";
import { isPgError, PG_FOREIGN_KEY_VIOLATION } from "../../lib/pgErrors";
import * as ordersRepository from "./orders.repository";
import type { Order } from "./orders.repository";
import type { CreateOrderInput, ListOrdersQuery, UpdateOrderInput } from "./orders.schemas";

// SERVICE: order business rules. `userId` is ALWAYS the first parameter and always comes from
// the verified login (never from client input); every function is therefore "for this user only".

export async function createOrder(userId: number, input: CreateOrderInput): Promise<Order> {
  try {
    return await ordersRepository.insert(userId, input);
  } catch (err) {
    // A valid, unexpired token whose user row was deleted. The foreign key rejects the insert.
    // The correct answer is "your session is no longer valid", not a server error.
    if (isPgError(err, PG_FOREIGN_KEY_VIOLATION)) {
      throw AppError.unauthorized("Account no longer exists");
    }
    throw err;
  }
}

// The response envelope for lists. Clients (and a future gateway) rely on this exact shape:
//   { data: [...], total, limit, offset }
// Returning a bare array would make adding pagination info later a BREAKING change.
export async function listOrders(userId: number, query: ListOrdersQuery) {
  const { rows, total } = await ordersRepository.listByUser(userId, query);
  return { data: rows, total, limit: query.limit, offset: query.offset };
}

export async function getOrder(userId: number, orderId: number): Promise<Order> {
  const order = await ordersRepository.findByIdForUser(orderId, userId);
  // 404 (not 403) when the order belongs to someone else: a 403 would confirm "this id exists",
  // letting an attacker enumerate other users' order ids.
  if (!order) throw AppError.notFound("Order");
  return order;
}

export async function updateOrder(userId: number, orderId: number, patch: UpdateOrderInput): Promise<Order> {
  const order = await ordersRepository.updateForUser(orderId, userId, patch);
  if (!order) throw AppError.notFound("Order");
  return order;
}

export async function deleteOrder(userId: number, orderId: number): Promise<void> {
  const deleted = await ordersRepository.deleteForUser(orderId, userId);
  if (!deleted) throw AppError.notFound("Order");
}
