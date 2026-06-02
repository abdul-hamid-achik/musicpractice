import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, computed, type ComputedRef } from 'vue';

// vi.mock is hoisted; reference shared state through a hoisted holder
// so the closure in the mock factory sees real values at import time.
const mocks = vi.hoisted(() => {
  const { ref, computed } = require('vue') as typeof import('vue');
  const authState = {
    user: ref<{
      id: string;
      email: string;
      username: string;
      name: string;
      avatarUrl: string | null;
      createdAt: string;
      updatedAt: string;
    } | null>(null),
    isAuthenticated: computed(() => !!authState.user.value) as ComputedRef<boolean>,
    userName: computed(() => authState.user.value?.name ?? '') as ComputedRef<string>,
    logout: () => {},
  };
  const sidebarState = { mobileOpen: ref(false), toggle: () => {}, close: () => {} };
  return { authState, sidebarState };
});

// Track calls separately (vi.hoisted can't include `vi.fn()` factory directly
// because vi isn't available inside the hoisted block)
const authState = mocks.authState;
const sidebarState = mocks.sidebarState;
authState.logout = vi.fn();
sidebarState.toggle = vi.fn();
sidebarState.close = vi.fn();

vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    userName: authState.userName,
    logout: authState.logout,
  }),
}));
vi.mock('~/composables/useSidebar', () => ({
  useSidebar: () => ({
    mobileOpen: sidebarState.mobileOpen,
    toggle: sidebarState.toggle,
    close: sidebarState.close,
  }),
}));

import AppHeader from '~/components/ui/AppHeader.vue';

const NuxtLinkStub = {
  template: '<a :href="to" :aria-current="ariaCurrent"><slot /></a>',
  props: ['to', 'ariaCurrent'],
};

const ThemeToggleStub = {
  template: '<button class="theme-toggle-stub" aria-label="Toggle theme">Theme</button>',
};

const mountHeader = (path = '/') => {
  (
    globalThis as {
      useRoute?: () => {
        path: string;
        params: Record<string, string>;
        query: Record<string, string>;
      };
    }
  ).useRoute = () => ({
    path,
    params: {},
    query: {},
  });
  return mount(AppHeader, {
    global: { stubs: { NuxtLink: NuxtLinkStub, ThemeToggle: ThemeToggleStub } },
  });
};

describe('AppHeader', () => {
  it('renders the brand name and logo', () => {
    const wrapper = mountHeader();
    expect(wrapper.text()).toContain('MusicPractice');
  });

  it('renders all 5 primary nav links', () => {
    const wrapper = mountHeader();
    for (const label of ['Dashboard', 'Practice', 'Instruments', 'Theory', 'Songs']) {
      expect(wrapper.text()).toContain(label);
    }
  });

  it('has role="banner" on the header element', () => {
    const wrapper = mountHeader();
    expect(wrapper.find('header[role="banner"]').exists()).toBe(true);
  });

  it('has a nav with role="navigation" and aria-label', () => {
    const wrapper = mountHeader();
    const nav = wrapper.find('nav[role="navigation"][aria-label="Primary navigation"]');
    expect(nav.exists()).toBe(true);
  });

  it('renders a sidebar toggle button with aria-label (state transition)', async () => {
    const wrapper = mountHeader();
    const toggleButton = wrapper.find('button[aria-label="Toggle navigation menu"]');
    expect(toggleButton.exists()).toBe(true);
    await toggleButton.trigger('click');
    expect(sidebarState.toggle).toHaveBeenCalled();
  });

  it('shows Sign in / Sign up when not authenticated', () => {
    authState.user.value = null;
    const wrapper = mountHeader();
    expect(wrapper.text()).toContain('Sign in');
    expect(wrapper.text()).toContain('Sign up');
  });

  it('shows the username and Sign out when authenticated', () => {
    authState.user.value = {
      id: '1',
      email: 'a@b.com',
      username: 'abdo',
      name: 'Abdul',
      avatarUrl: null,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
    const wrapper = mountHeader();
    expect(wrapper.text()).toContain('Abdul');
    expect(wrapper.text()).toContain('Sign out');
    expect(wrapper.text()).not.toContain('Sign in');
    // cleanup
    authState.user.value = null;
  });

  it('calls logout when Sign out is clicked (state transition)', async () => {
    authState.user.value = {
      id: '1',
      email: 'a@b.com',
      username: 'abdo',
      name: 'Abdul',
      avatarUrl: null,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
    const wrapper = mountHeader();
    const signOutButton = wrapper.findAll('button').find((b) => b.text() === 'Sign out')!;
    await signOutButton.trigger('click');
    expect(authState.logout).toHaveBeenCalled();
    authState.user.value = null;
  });

  it('marks the active link with aria-current="page"', () => {
    const wrapper = mountHeader('/practice');
    // Find the NuxtLink to /practice — should have aria-current="page"
    const activeLink = wrapper.find('a[aria-current="page"]');
    expect(activeLink.exists()).toBe(true);
    expect(activeLink.text()).toBe('Practice');
  });
});
