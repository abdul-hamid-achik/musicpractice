/**
 * Tests for server/utils/errors.ts
 *
 * `errors.ts` depends on the `createError` h3 helper, which `tests/setup.ts`
 * already stubs globally. We just import the module and verify the error
 * objects that fall out.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createApiError,
  createValidationError,
  createAuthError,
  createNotFoundError,
  createConflictError,
  createForbiddenError,
  handleApiError,
  validateId,
  isH3Error,
  safeExecute,
} from './errors';

// UUIDs are static helpers; a single valid + invalid pair is enough.
const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('createApiError', () => {
  it('defaults to 500 when no status code given', () => {
    const err = createApiError('boom') as Error & { statusCode?: number; data?: unknown };
    expect(err.statusCode).toBe(500);
    expect(err.data).toMatchObject({
      statusCode: 500,
      message: 'boom',
    });
    expect((err.data as { timestamp: string }).timestamp).toMatch(/T.*Z/);
  });

  it('accepts custom status code', () => {
    const err = createApiError('bad', 400) as Error & { statusCode?: number; data?: unknown };
    expect(err.statusCode).toBe(400);
  });

  it('attaches details when provided', () => {
    const details = { email: ['required'] };
    const err = createApiError('bad', 400, details) as Error & { data?: { details?: unknown } };
    expect(err.data?.details).toEqual(details);
  });

  it('omits details when not provided', () => {
    const err = createApiError('boom') as Error & { data?: Record<string, unknown> };
    expect(err.data).not.toHaveProperty('details');
  });
});

describe('factory helpers', () => {
  it('createValidationError returns 400 with details', () => {
    const err = createValidationError('Validation failed', { x: ['bad'] }) as Error & {
      statusCode?: number;
      data?: { details?: unknown };
    };
    expect(err.statusCode).toBe(400);
    expect(err.data?.details).toEqual({ x: ['bad'] });
  });

  it('createAuthError returns 401 by default', () => {
    const err = createAuthError() as Error & { statusCode?: number; data?: { message?: string } };
    expect(err.statusCode).toBe(401);
    expect(err.data?.message).toBe('Authentication required');
  });

  it('createAuthError accepts custom message', () => {
    const err = createAuthError('Token expired') as Error & { data?: { message?: string } };
    expect((err.data as { message: string }).message).toBe('Token expired');
  });

  it('createNotFoundError prefixes with resource name', () => {
    const err = createNotFoundError('Song') as Error & {
      statusCode?: number;
      data?: { message?: string };
    };
    expect(err.statusCode).toBe(404);
    expect((err.data as { message: string }).message).toBe('Song not found');
  });

  it('createNotFoundError default resource name', () => {
    const err = createNotFoundError() as Error & { data?: { message?: string } };
    expect((err.data as { message: string }).message).toBe('Resource not found');
  });

  it('createConflictError returns 409', () => {
    const err = createConflictError('taken') as Error & {
      statusCode?: number;
      data?: { message?: string };
    };
    expect(err.statusCode).toBe(409);
    expect((err.data as { message: string }).message).toBe('taken');
  });

  it('createForbiddenError returns 403 by default', () => {
    const err = createForbiddenError() as Error & { statusCode?: number };
    expect(err.statusCode).toBe(403);
  });
});

describe('isH3Error', () => {
  it('returns true for objects with statusCode', () => {
    const err = createApiError('x', 400) as unknown as Record<string, unknown>;
    expect(isH3Error(err)).toBe(true);
  });

  it('returns false for plain errors', () => {
    expect(isH3Error(new Error('plain'))).toBe(false);
  });

  it('returns false for non-objects and null', () => {
    expect(isH3Error(null)).toBe(false);
    expect(isH3Error('string')).toBe(false);
    expect(isH3Error(undefined)).toBe(false);
    expect(isH3Error(42)).toBe(false);
  });
});

describe('handleApiError', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('returns the error as-is when it has statusCode (already an H3 error)', () => {
    const err = createApiError('original', 418) as Error & { statusCode?: number };
    const result = handleApiError(err);
    expect(result).toBe(err);
  });

  it('wraps plain Error into a 500 with logging', () => {
    const result = handleApiError(new Error('boom'), {
      route: '/x',
      userId: 'u1',
      operation: 'op',
    }) as Error & { statusCode?: number; data?: { message?: string; details?: unknown } };
    expect(result.statusCode).toBe(500);
    expect(result.data?.message).toBe('boom');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('wraps string errors', () => {
    const result = handleApiError('string-failure', {}) as Error & { data?: { message?: string } };
    expect((result.data as { message: string }).message).toBe('string-failure');
  });

  it('logs route/userId/operation from context', () => {
    handleApiError(new Error('x'), { route: '/api/x', userId: 'u7', operation: 'create' });
    const loggedArg = consoleSpy.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(loggedArg).toMatchObject({
      route: '/api/x',
      userId: 'u7',
      operation: 'create',
      message: 'x',
    });
  });

  it('uses defaults when context fields are missing', () => {
    handleApiError(new Error('x'), {});
    const loggedArg = consoleSpy.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(loggedArg).toMatchObject({
      route: 'unknown',
      userId: 'anonymous',
      operation: 'unknown',
    });
  });
});

describe('validateId', () => {
  it('returns the id when valid UUID', () => {
    expect(validateId(VALID_UUID)).toBe(VALID_UUID);
  });

  it('throws 400 when id is missing', () => {
    try {
      validateId(undefined);
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as Error & { statusCode?: number }).statusCode).toBe(400);
    }
  });

  it('throws 400 when id is empty string', () => {
    try {
      validateId('', 'preset');
      throw new Error('should have thrown');
    } catch (e) {
      const err = e as Error & { statusCode?: number; data?: { message?: string } };
      expect(err.statusCode).toBe(400);
      expect((err.data as { message: string }).message).toContain('preset');
    }
  });

  it('throws 400 when id is not a UUID', () => {
    try {
      validateId('not-a-uuid');
      throw new Error('should have thrown');
    } catch (e) {
      const err = e as Error & { statusCode?: number; data?: { message?: string } };
      expect(err.statusCode).toBe(400);
      expect((err.data as { message: string }).message).toContain('Invalid');
    }
  });

  it('uses provided paramName in error message', () => {
    try {
      validateId(undefined, 'session id');
      throw new Error('should have thrown');
    } catch (e) {
      const err = e as Error & { data?: { message?: string } };
      expect((err.data as { message: string }).message).toContain('session id');
    }
  });
});

describe('safeExecute', () => {
  it('returns the result on success', async () => {
    const result = await safeExecute(async () => 42, { route: '/x' });
    expect(result).toBe(42);
  });

  it('rethrows via handleApiError on failure', async () => {
    const err = await safeExecute(
      async () => {
        throw new Error('op-fail');
      },
      { route: '/x' },
    ).catch((e: Error & { data?: { message?: string } }) => e);
    expect((err as Error & { data?: { message?: string } }).data?.message).toBe('op-fail');
  });

  it('passes context through to handleApiError', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      await safeExecute(
        async () => {
          throw new Error('x');
        },
        { route: '/y', userId: 'u' },
      );
    } catch {
      // expected
    }
    const loggedArg = consoleSpy.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(loggedArg).toMatchObject({ route: '/y', userId: 'u' });
    consoleSpy.mockRestore();
  });
});
