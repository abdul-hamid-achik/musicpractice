/**
 * Tests for server/utils/env.ts
 *
 * `env.ts` runs validation at module-import time, so most of the "interesting"
 * branches only fire when NODE_ENV flips. These tests use vi.resetModules +
 * dynamic import to exercise each branch in isolation.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const ORIGINAL_ENV = { ...process.env };

async function importFreshEnv() {
  vi.resetModules();
  return await import('./env');
}

describe('server/utils/env', () => {
  beforeEach(() => {
    // Always start with required values
    process.env.DATABASE_URL = 'postgresql://u:p@host:5432/db';
    process.env.JWT_SECRET = 'a-32-character-test-secret-for-vitest';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    // Restore env
    for (const key of Object.keys(process.env)) {
      if (!(key in ORIGINAL_ENV)) delete process.env[key];
    }
    Object.assign(process.env, ORIGINAL_ENV);
    vi.restoreAllMocks();
  });

  it('exposes the validated env object', async () => {
    const mod = await importFreshEnv();
    expect(mod.env.DATABASE_URL).toBe('postgresql://u:p@host:5432/db');
    expect(mod.env.JWT_SECRET).toBe('a-32-character-test-secret-for-vitest');
    expect(mod.env.NODE_ENV).toBe('test');
    expect(mod.env.isProduction).toBe(false);
  });

  it('defaults NODE_ENV to development when not set', async () => {
    delete process.env.NODE_ENV;
    const mod = await importFreshEnv();
    expect(mod.env.NODE_ENV).toBe('development');
    expect(mod.env.isProduction).toBe(false);
  });

  it('warns when JWT_SECRET is missing in non-production', async () => {
    delete process.env.JWT_SECRET;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await importFreshEnv();
    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy.mock.calls.some((c) => String(c[0]).includes('JWT_SECRET'))).toBe(true);
  });

  it('warns when JWT_SECRET is too short in non-production', async () => {
    process.env.JWT_SECRET = 'short';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await importFreshEnv();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('warns when JWT_SECRET is the development default in non-production', async () => {
    process.env.JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production-min-32-chars';
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await importFreshEnv();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('throws in production when DATABASE_URL is missing', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.DATABASE_URL;
    await expect(importFreshEnv()).rejects.toThrow(/DATABASE_URL/);
  });

  it('throws in production when JWT_SECRET is missing', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    await expect(importFreshEnv()).rejects.toThrow(/JWT_SECRET/);
  });

  it('throws in production when JWT_SECRET is too short', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'short';
    await expect(importFreshEnv()).rejects.toThrow(/at least 32/);
  });

  it('throws in production when JWT_SECRET is the development default', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production-min-32-chars';
    await expect(importFreshEnv()).rejects.toThrow(/development default/);
  });

  it('exposes isProduction=true in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a-32-character-strong-secret-okay';
    const mod = await importFreshEnv();
    expect(mod.env.isProduction).toBe(true);
  });
});
