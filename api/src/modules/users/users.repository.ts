import { pool } from "../../db";

// REPOSITORY LAYER: the only place that knows the users table and its SQL.
// Services call these functions and never write SQL themselves. The payoff: when the schema
// changes (or the users table moves into its own service/database) only this file changes.
//
// There is deliberately NO users.routes.ts: with no roles/admin concept yet, a public
// "list users" endpoint would just leak every email address. Users are reached only through
// the auth module (register / login / me).

// What the rest of the app and API responses may see. It never includes the password hash.
export type User = {
  id: number;
  name: string;
  email: string;
};

// Shape of a row as stored in Postgres (snake_case, plus the hash).
type UserRow = { id: number; name: string; email: string; password: string };

// Only auth.service.login() needs the hash, so it gets a separate type.
// Keeping it separate makes it hard to return a hash to a client by accident.
export type UserWithPasswordHash = User & { passwordHash: string };

const toUser = (row: UserRow): User => ({ id: row.id, name: row.name, email: row.email });

export async function findById(id: number): Promise<User | null> {
  const result = await pool.query<UserRow>("SELECT id, name, email, password FROM users WHERE id = $1", [id]);
  const row = result.rows[0];
  return row ? toUser(row) : null;
}

// `email` must already be lower-cased by the caller (the zod schema does it).
export async function findByEmailWithPasswordHash(email: string): Promise<UserWithPasswordHash | null> {
  const result = await pool.query<UserRow>(
    "SELECT id, name, email, password FROM users WHERE email = $1",
    [email],
  );
  const row = result.rows[0];
  return row ? { ...toUser(row), passwordHash: row.password } : null;
}

// Throws a Postgres unique-violation error (23505) if the email is taken; the service converts
// that into a friendly 409. We rely on the DB's UNIQUE constraint rather than "SELECT first, then
// INSERT" because two simultaneous sign-ups could both pass the SELECT (a race condition).
export async function create(input: { name: string; email: string; passwordHash: string }): Promise<User> {
  const result = await pool.query<UserRow>(
    "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, password",
    [input.name, input.email, input.passwordHash],
  );
  // INSERT ... RETURNING always yields one row; the guard satisfies noUncheckedIndexedAccess.
  const row = result.rows[0];
  if (!row) throw new Error("INSERT INTO users returned no row");
  return toUser(row);
}
