import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from '~/stores/auth';

const mockFetch = vi.fn();
vi.stubGlobal('$fetch', mockFetch);

const mockToast = {
  toasts: ref([]),
  showToast: vi.fn(),
  removeToast: vi.fn(),
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showInfo: vi.fn(),
  showWarning: vi.fn(),
  clearAll: vi.fn(),
};
vi.stubGlobal('useToastStore', () => mockToast);

const mockNavigateTo = vi.fn();
vi.stubGlobal('navigateTo', mockNavigateTo);

let callIndex = 0;
// [callIndex]: what the Nth call to $fetch should return
// Set this per-test AFTER store creation to control the test call
// (the init fetchUser call always uses default — rejection)
let nextMockResult: unknown = null;

function setupMockFetch() {
  callIndex = 0;
  nextMockResult = null;
  mockFetch.mockImplementation(() => {
    callIndex++;
    // First call is always init fetchUser — reject it
    if (callIndex === 1) {
      return Promise.reject(new Error('Not authenticated'));
    }
    // Subsequent calls use nextMockResult
    if (nextMockResult instanceof Error) {
      return Promise.reject(nextMockResult);
    }
    return Promise.resolve(nextMockResult);
  });
}

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    setupMockFetch();
  });

  it('has correct initial state', () => {
    const store = useAuthStore();
    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(store.loading).toBe(false);
    expect(store.userName).toBe('');
    expect(store.userId).toBe('');
  });

  it('login sets user on success', async () => {
    const user = { id: '1', email: 'test@test.com', username: 'test', name: 'Test User' };
    nextMockResult = user;

    const store = useAuthStore();
    await store.login('test@test.com', 'password123');

    expect(store.user).toEqual(user);
    expect(store.isAuthenticated).toBe(true);
    expect(store.userName).toBe('Test User');
  });

  it('login shows error toast and rethrows on failure', async () => {
    nextMockResult = new Error('Invalid credentials');

    const store = useAuthStore();
    await expect(store.login('bad', 'bad')).rejects.toThrow();
    expect(mockToast.showError).toHaveBeenCalledWith(
      'Login failed. Please check your credentials.',
      undefined,
    );
    expect(store.user).toBeNull();
  });

  it('login sets loading state correctly', async () => {
    let resolveFetch: (value: unknown) => void;
    mockFetch.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) return Promise.reject(new Error('Not authenticated'));
      // Login call — controllable promise
      return new Promise((resolve) => {
        resolveFetch = resolve;
      });
    });

    const store = useAuthStore();
    const promise = store.login('test@test.com', 'pass');
    expect(store.loading).toBe(true);

    resolveFetch!({ id: '1', email: 'test@test.com', username: 'test', name: 'Test' });
    await promise;
    expect(store.loading).toBe(false);
  });

  it('register sets user on success', async () => {
    const user = { id: '1', email: 'new@test.com', username: 'newuser', name: 'New' };
    nextMockResult = user;

    const store = useAuthStore();
    await store.register('new@test.com', 'newuser', 'password123', 'New');

    expect(store.user).toEqual(user);
    expect(store.isAuthenticated).toBe(true);
  });

  it('register shows error toast on failure', async () => {
    nextMockResult = new Error('Email taken');

    const store = useAuthStore();
    await expect(store.register('bad', 'bad', 'bad', 'bad')).rejects.toThrow();
    expect(mockToast.showError).toHaveBeenCalledWith(
      'Registration failed. Please try again.',
      undefined,
    );
  });

  it('logout clears user and navigates', async () => {
    nextMockResult = undefined;

    const store = useAuthStore();
    store.user = {
      id: '1',
      email: 'a@b.com',
      username: 'a',
      name: 'A',
      avatarUrl: null,
      createdAt: '',
      updatedAt: '',
    };
    await store.logout();

    expect(store.user).toBeNull();
    expect(mockNavigateTo).toHaveBeenCalledWith('/auth/login');
  });

  it('fetchUser sets user on success', async () => {
    const user = { id: '1', email: 'a@b.com', username: 'a', name: 'A' };
    nextMockResult = user;

    const store = useAuthStore();
    await store.fetchUser();
    expect(store.user).toEqual(user);
  });

  it('fetchUser sets user to null on failure', async () => {
    nextMockResult = new Error('Not authenticated');

    const store = useAuthStore();
    await store.fetchUser();
    expect(store.user).toBeNull();
  });
});
