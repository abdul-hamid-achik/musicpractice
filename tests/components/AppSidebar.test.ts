import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, computed } from 'vue';

const mocks = vi.hoisted(() => {
  const { ref, computed } = require('vue') as typeof import('vue');
  return {
    authState: {
      user: ref<{
        id: string;
        email: string;
        username: string;
        name: string;
        avatarUrl: string | null;
        createdAt: string;
        updatedAt: string;
      } | null>(null),
      isAuthenticated: computed(() => !!mocks.authState?.user.value),
      userName: computed(() => mocks.authState?.user.value?.name ?? ''),
      logout: () => {},
    },
    sidebarState: { mobileOpen: ref(false), toggle: () => {}, close: () => {} },
  };
});
mocks.authState.logout = vi.fn();
mocks.sidebarState.close = vi.fn();
const authState = mocks.authState;
const sidebarState = mocks.sidebarState;

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

import AppSidebar from '~/components/ui/AppSidebar.vue';

const NuxtLinkStub = {
  template: '<a :href="to" :aria-current="ariaCurrent"><slot /></a>',
  props: ['to', 'ariaCurrent'],
};

const mountSidebar = (path = '/', mobileOpen = false) => {
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
  sidebarState.mobileOpen.value = mobileOpen;
  return mount(AppSidebar, {
    global: { stubs: { NuxtLink: NuxtLinkStub } },
  });
};

describe('AppSidebar', () => {
  it('renders 3 sections (Practice, Instruments, Theory)', () => {
    const wrapper = mountSidebar();
    for (const label of ['Practice', 'Instruments', 'Theory']) {
      expect(wrapper.text()).toContain(label);
    }
  });

  it('renders the standalone links (Songs, Settings, Account)', () => {
    const wrapper = mountSidebar();
    for (const label of ['Songs', 'Settings', 'Account']) {
      expect(wrapper.text()).toContain(label);
    }
  });

  it('has role="complementary" on the aside element', () => {
    const wrapper = mountSidebar();
    expect(wrapper.find('aside[role="complementary"]').exists()).toBe(true);
  });

  it('has an aria-label on the sidebar', () => {
    const wrapper = mountSidebar();
    expect(wrapper.find('aside[aria-label="Sidebar navigation"]').exists()).toBe(true);
  });

  it('marks the active link with aria-current="page"', () => {
    const wrapper = mountSidebar('/instruments/guitar');
    const activeLink = wrapper.find('a[aria-current="page"]');
    expect(activeLink.exists()).toBe(true);
    expect(activeLink.text()).toBe('Guitar');
  });

  it('calls sidebar.close() when a link is clicked (state transition)', async () => {
    sidebarState.close.mockClear();
    const wrapper = mountSidebar();
    const link = wrapper.find('a');
    await link.trigger('click');
    expect(sidebarState.close).toHaveBeenCalled();
  });

  it('shows the user section when authenticated', () => {
    authState.user.value = {
      id: '1',
      email: 'a@b.com',
      username: 'abdo',
      name: 'Abdul',
      avatarUrl: null,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };
    const wrapper = mountSidebar();
    expect(wrapper.text()).toContain('Abdul');
    expect(wrapper.text()).toContain('Sign out');
    authState.user.value = null;
  });

  it('hides the user section when not authenticated', () => {
    authState.user.value = null;
    const wrapper = mountSidebar();
    expect(wrapper.text()).not.toContain('Sign out');
  });

  it('renders the mobile backdrop when mobileOpen is true', () => {
    const wrapper = mountSidebar('/', true);
    // The backdrop has a z-20 class
    const backdrops = wrapper.findAll('div.z-20');
    expect(backdrops.length).toBeGreaterThan(0);
  });
});
