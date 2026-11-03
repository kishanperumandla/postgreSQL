import { compare, hash, hashSync } from "bcryptjs";
import { AppError } from "../../lib/errors";
import { isPgError, PG_UNIQUE_VIOLATION } from "../../lib/pgErrors";
import * as usersRepository from "../users/users.repository";
import type { User } from "../users/users.repository";
import type { LoginInput, RegisterInput } from "./auth.schemas";
import { signAccessToken } from "./auth.tokens";

// SERVICE LAYER: business rules. It knows nothing about HTTP (no req/res, no status codes
// except through AppError) and nothing about SQL (that is the repository's job).
// That split is what makes it testable and reusable when this becomes its own microservice.

// bcrypt "cost": each +1 doubles the hashing time. 10 is the common baseline (~50-100 ms).
// Slow on purpose: it makes guessing passwords from a stolen database very expensive.
const BCRYPT_COST = 10;

// A real bcrypt hash of a throwaway string, computed once at startup. See login() for why.
const DUMMY_HASH = hashSync("not-a-real-password", BCRYPT_COST);

export async function register(input: RegisterInput): Promise<User> {
  // NEVER store the plain password. If the DB leaks, hashes (with per-password salt, built into
  // bcrypt) can't be reversed; plain text would expose every account - and the same password on other sites.
  const passwordHash = await hash(input.password, BCRYPT_COST);

  try {
    return await usersRepository.create({ name: input.name, email: input.email, passwordHash });
  } catch (err) {
    if (isPgError(err, PG_UNIQUE_VIOLATION)) {
      // Trade-off: telling the user "email taken" lets someone check whether an address has an
      // account (enumeration). We accept it for clear sign-up UX; the rate limiter slows abuse.
      throw AppError.conflict("EMAIL_TAKEN", "An account with this email already exists");
    }
    throw err; // unexpected -> 500 via errorHandler
  }
}

export async function login(input: LoginInput): Promise<{ user: User; token: string }> {
  const found = await usersRepository.findByEmailWithPasswordHash(input.email);

  // TIMING-ATTACK DEFENCE: if the email doesn't exist we STILL run a bcrypt compare (against a
  // dummy hash). Otherwise "unknown email" returns in ~1 ms while "wrong password" takes ~80 ms,
  // and an attacker can measure the difference to learn which emails are registered.
  const passwordMatches = await compare(input.password, found?.passwordHash ?? DUMMY_HASH);

  if (!found || !passwordMatches) {
    // SAME message for "no such user" and "wrong password" - again so the response doesn't reveal which.
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const { passwordHash: _passwordHash, ...user } = found; // strip the hash: it must never leave this function
  return { user, token: signAccessToken(user.id) };
}

// Used by GET /auth/me: "who am I?". The frontend calls it on page load to learn whether the
// cookie it holds still represents a real account.
export async function getCurrentUser(userId: number): Promise<User> {
  const user = await usersRepository.findById(userId);
  if (!user) {
    // The token was valid but the account no longer exists (deleted): treat as logged out.
    throw AppError.unauthorized();
  }
  return user;
}
