import { apiFetch } from "@/lib/apiClient";
import { isApiError } from "@/lib/apiError";
import {
  userResponseSchema,
  type LoginFormValues,
  type RegisterPayload,
  type User,
} from "@/schemas/authSchemas";

// API LAYER for auth: plain async functions, one per endpoint. No React, no toasts, no navigation.
// They know URLs and shapes only - hooks.ts decides when to call them and what to do with the result.
// This file is the unit that maps to the future "auth" microservice: if its URLs ever change, only this changes.

// "Who am I?". A 401 is an ANSWER here ("nobody is logged in"), not a failure, so it resolves to null.
// Treating it as an error would make every first visit of a logged-out user trigger error handling/toasts.
export async function fetchMe(): Promise<User | null> {
  try {
    const { user } = await apiFetch("/auth/me", { schema: userResponseSchema });
    return user;
  } catch (error) {
    if (isApiError(error) && error.status === 401) return null;
    throw error;
  }
}

export async function login(values: LoginFormValues): Promise<User> {
  const { user } = await apiFetch("/auth/login", {
    method: "POST",
    body: values,
    schema: userResponseSchema,
  });
  return user;
}

export async function register(payload: RegisterPayload): Promise<User> {
  const { user } = await apiFetch("/auth/register", {
    method: "POST",
    body: payload,
    schema: userResponseSchema,
  });
  return user;
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
}
