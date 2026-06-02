import { createError, type H3Event } from 'h3';
import { getOptionalAuth } from './auth';

/**
 * In-memory rate-limit store, keyed by namespace:identifier.
 *
 * The store is process-local — sufficient for a single-instance dev / staging
 * deployment. A production cluster should swap this for a Redis-backed
 * implementation behind the same `checkRateLimit` signature.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000;
const DEFAULT_MAX = 10;

/**
 * Build a per-user or per-IP key for a given namespace.
 *
 * Authenticated requests get a per-user key so one noisy IP cannot starve
 * another user on a shared NAT (and vice versa). Anonymous requests fall
 * back to the request IP, honouring `X-Forwarded-For` when present.
 */
export async function getRateLimitKey(event: H3Event, namespace: string): Promise<string> {
  try {
    const user = await getOptionalAuth(event);
    if (user) return `${namespace}:user:${user.id}`;
  } catch {
    // Fall through to IP-based keying if auth lookup fails.
  }
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown';
  return `${namespace}:ip:${ip}`;
}

/**
 * Increment the counter for `key` and throw a 429 if it exceeds `max`
 * within the rolling `WINDOW_MS` window.
 *
 * @param key      Usually `<namespace>:<user|id>:<id>` — see `getRateLimitKey`.
 * @param max      Maximum allowed requests per window (default 10).
 */
export function checkRateLimit(key: string, max: number = DEFAULT_MAX): void {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  record.count++;

  if (record.count > max) {
    throw createError({
      statusCode: 429,
      message: 'Too many requests. Please try again later.',
    });
  }
}

/**
 * Convenience wrapper: build the key and apply the limit in one call.
 */
export async function applyRateLimit(
  event: H3Event,
  namespace: string,
  max: number = DEFAULT_MAX,
): Promise<void> {
  const key = await getRateLimitKey(event, namespace);
  checkRateLimit(key, max);
}

export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, record] of attempts.entries()) {
    if (now > record.resetAt) {
      attempts.delete(key);
    }
  }
}

setInterval(cleanupRateLimitStore, WINDOW_MS);
