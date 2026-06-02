import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSidebar } from '~/composables/useSidebar';

/**
 * useSidebar wraps Nuxt's `useState` for a boolean `mobileOpen` flag.
 * Because Nuxt isn't running in tests, we stub `useState` to behave like a
 * plain shared ref so the composable works in isolation.
 */

const stateMock: Record<string, { value: unknown }> = {};

beforeEach(() => {
  setActivePinia(createPinia());
  for (const key of Object.keys(stateMock)) delete stateMock[key];

  vi.stubGlobal('useState', (key: string, init?: () => unknown) => {
    if (!stateMock[key]) {
      stateMock[key] = { value: init ? init() : undefined };
    }
    return stateMock[key];
  });
});

describe('useSidebar', () => {
  it('mobileOpen starts false', () => {
    const { mobileOpen } = useSidebar();
    expect(mobileOpen.value).toBe(false);
  });

  it('toggle flips mobileOpen from false to true', () => {
    const { mobileOpen, toggle } = useSidebar();
    expect(mobileOpen.value).toBe(false);
    toggle();
    expect(mobileOpen.value).toBe(true);
  });

  it('toggle flips mobileOpen from true to false', () => {
    const { mobileOpen, toggle } = useSidebar();
    mobileOpen.value = true;
    toggle();
    expect(mobileOpen.value).toBe(false);
  });

  it('close sets mobileOpen to false', () => {
    const { mobileOpen, close } = useSidebar();
    mobileOpen.value = true;
    close();
    expect(mobileOpen.value).toBe(false);
  });

  it('close is a no-op when already false', () => {
    const { mobileOpen, close } = useSidebar();
    close();
    expect(mobileOpen.value).toBe(false);
  });

  it('toggle then close returns to false', () => {
    const { mobileOpen, toggle, close } = useSidebar();
    toggle();
    expect(mobileOpen.value).toBe(true);
    close();
    expect(mobileOpen.value).toBe(false);
  });

  it('shares state across multiple useSidebar() calls', () => {
    const a = useSidebar();
    const b = useSidebar();
    a.toggle();
    expect(b.mobileOpen.value).toBe(true);
  });
});
