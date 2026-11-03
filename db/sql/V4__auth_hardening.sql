-- V4: prepare the schema for real authentication.
-- Database: app_db
--
-- Why a NEW migration instead of editing V1-V3?
--   Flyway stores a checksum of every applied migration. Editing an applied file makes
--   `flyway validate` / `flyway migrate` fail on every machine that already ran it.
--   Rule: applied migrations are immutable; every schema change is a new Vxx file.

-- ---------------------------------------------------------------------------
-- 1. Re-hash the plain-text seed passwords (users 1-3 from V2).
-- ---------------------------------------------------------------------------
-- pgcrypto gives us bcrypt inside Postgres: crypt(password, gen_salt('bf', 10)).
-- The output ($2a$10$...) is the same bcrypt format the API's bcryptjs `compare()` reads,
-- so these users can log in with their ORIGINAL passwords (abc@123, kishan@123, raju@123).
-- Cost factor 10 matches the API's hash(password, 10).
--
-- If skipped: login would compare a bcrypt hash against a plain-text value and always fail
-- for these users - and the plain-text passwords would stay readable by anyone with DB access.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- The NOT LIKE guard makes this safe to re-run: rows that are already bcrypt ($2a$/$2b$/$2y$)
-- are left alone, so we never hash a hash.
UPDATE users
SET password = crypt(password, gen_salt('bf', 10))
WHERE password IS NOT NULL
  AND password NOT LIKE '$2_$%';

-- ---------------------------------------------------------------------------
-- 2. Store emails lower-case.
-- ---------------------------------------------------------------------------
-- The API lower-cases emails before saving/looking them up. Normalising existing rows too
-- means "Raman@Gmail.com" and "raman@gmail.com" can never become two different accounts.
-- (Checked beforehand: no two existing emails collide after lower-casing.)
UPDATE users SET email = lower(email) WHERE email <> lower(email);

-- ---------------------------------------------------------------------------
-- 3. NOT NULL: the database enforces what the API already validates.
-- ---------------------------------------------------------------------------
-- The API validates input, but the database is the last line of defence: another service,
-- a script, or a future bug can bypass the API. Without these, a row with a NULL password
-- or a NULL owner could exist and every query would need to defend against it.
ALTER TABLE users
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN password SET NOT NULL;

ALTER TABLE orders
  ALTER COLUMN user_id SET NOT NULL,       -- every order MUST have an owner
  ALTER COLUMN product_name SET NOT NULL,
  ALTER COLUMN quantity SET NOT NULL,
  ALTER COLUMN price SET NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. CHECK constraints: reject impossible values at the source.
-- ---------------------------------------------------------------------------
ALTER TABLE orders
  ADD CONSTRAINT orders_quantity_positive CHECK (quantity > 0),
  ADD CONSTRAINT orders_price_non_negative CHECK (price >= 0);

-- ---------------------------------------------------------------------------
-- 5. Index for "my orders" queries.
-- ---------------------------------------------------------------------------
-- Every order query is now scoped by owner (WHERE user_id = $me ORDER BY id).
-- A composite (user_id, id) index serves both the filter and the sort order.
-- Without it Postgres scans the whole orders table for every request, which is fine
-- with 3 rows and painful with 3 million.
CREATE INDEX IF NOT EXISTS idx_orders_user_id_id ON orders (user_id, id);
