/**
 * Centralised environment-variable loader and validator.
 *
 * Imported by `server/utils/db.ts` and `server/utils/auth.ts` so the rest of
 * the server code can rely on a validated, fully-typed `env` object instead
 * of scattering `process.env.X` reads across modules.
 *
 * Validation rules:
 *  - `DATABASE_URL` is required in every environment. A missing value throws
 *    on import — better to fail loudly at boot than 500 silently at the first
 *    DB query.
 *  - `JWT_SECRET` is required in production and must be at least 32 chars
 *    and not equal to the well-known dev default that ships in
 *    `.env.example`. In development we still warn (don't throw) so the local
 *    quickstart keeps working.
 */
const DEFAULT_JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production-min-32-chars';

function readEnv() {
  const DATABASE_URL = process.env.DATABASE_URL;
  const JWT_SECRET = process.env.JWT_SECRET;
  const NODE_ENV = (process.env.NODE_ENV ?? 'development') as
    | 'development'
    | 'production'
    | 'test'
    | string;

  if (!DATABASE_URL) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
        'Copy .env.example to .env and configure it.',
    );
  }

  const isProduction = NODE_ENV === 'production';

  if (isProduction) {
    if (!JWT_SECRET) {
      throw new Error(
        'JWT_SECRET environment variable is required in production. ' +
          'Generate one with `openssl rand -hex 32`.',
      );
    }

    if (JWT_SECRET.length < 32) {
      throw new Error(
        'JWT_SECRET must be at least 32 characters long in production ' +
          `(got ${JWT_SECRET.length}).`,
      );
    }

    if (JWT_SECRET === DEFAULT_JWT_SECRET) {
      throw new Error(
        'JWT_SECRET is set to the well-known development default. ' +
          'Set a strong, unique secret in production.',
      );
    }
  } else if (!JWT_SECRET) {
    // Allow local dev / tests to run without JWT_SECRET, but make the gap
    // obvious in the logs.
    console.warn(
      '[env] JWT_SECRET is not set. Authentication will fail until you ' +
        'add a 32+ character secret to your .env file.',
    );
  } else if (JWT_SECRET.length < 32) {
    console.warn(
      `[env] JWT_SECRET is only ${JWT_SECRET.length} characters; use 32+ for production-grade security.`,
    );
  } else if (JWT_SECRET === DEFAULT_JWT_SECRET) {
    console.warn(
      '[env] JWT_SECRET is the development default from .env.example. ' +
        'Replace it before deploying to production.',
    );
  }

  return {
    DATABASE_URL,
    JWT_SECRET: JWT_SECRET ?? '',
    NODE_ENV,
    isProduction,
  } as const;
}

export const env = readEnv();
export type Env = typeof env;
