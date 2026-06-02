import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent, h, ref, nextTick, type Ref } from 'vue';
import { mount } from '@vue/test-utils';
import {
  useFocusTrap,
  useEscapeKey,
  useAnnouncer,
  getFocusableElements,
  isElementFocused,
  useKeyboardNavigation,
} from '~/composables/useAccessibility';

/**
 * useAccessibility covers several independent helpers — we test each in its
 * own describe block so failure messages are clear and the lifecycle hooks
 * (onMounted / onBeforeUnmount) have predictable cleanup.
 */

beforeEach(() => {
  document.body.innerHTML = '';
  // Make document.activeElement controllable — happy-dom starts with body
  if (document.activeElement && document.activeElement !== document.body) {
    (document.activeElement as HTMLElement).blur?.();
  }
});

afterEach(() => {
  document.body.innerHTML = '';
});

// -- helpers ----------------------------------------------------------------

/** Build a container with a list of focusable children, return a ref to it. */
function makeContainer(children: Array<{ tag: string; attrs?: Record<string, string> }>) {
  const container = document.createElement('div');
  for (const c of children) {
    const el = document.createElement(c.tag);
    if (c.attrs) {
      for (const [k, v] of Object.entries(c.attrs)) el.setAttribute(k, v);
    }
    container.appendChild(el);
  }
  document.body.appendChild(container);
  return container;
}

/** Fire a keydown on `document` (useFocusTrap / useEscapeKey attach there). */
function fireDocKey(key: string, opts: Partial<KeyboardEventInit> = {}) {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts });
  document.dispatchEvent(e);
  return e;
}

function fireContainerKey(
  container: HTMLElement,
  key: string,
  opts: Partial<KeyboardEventInit> = {},
) {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts });
  container.dispatchEvent(e);
  return e;
}

// =================================================================
// useFocusTrap
// =================================================================

describe('useFocusTrap', () => {
  function mountTrap(container: HTMLElement, options: Parameters<typeof useFocusTrap>[1] = {}) {
    const containerRef = ref<HTMLElement | null>(container) as Ref<HTMLElement | null>;
    const trap = useFocusTrap(containerRef, options);
    return { containerRef, ...trap };
  }

  it('starts inactive', () => {
    const c = makeContainer([{ tag: 'button' }, { tag: 'button' }]);
    const trap = mountTrap(c);
    expect(trap.isActive.value).toBe(false);
  });

  it('activate() flips isActive to true', async () => {
    const c = makeContainer([{ tag: 'button' }, { tag: 'button' }]);
    const trap = mountTrap(c);
    trap.activate();
    await nextTick();
    expect(trap.isActive.value).toBe(true);
  });

  it('deactivate() flips isActive to false', async () => {
    const c = makeContainer([{ tag: 'button' }]);
    const trap = mountTrap(c);
    trap.activate();
    await nextTick();
    trap.deactivate();
    expect(trap.isActive.value).toBe(false);
  });

  it('activate() is idempotent', async () => {
    const c = makeContainer([{ tag: 'button' }]);
    const trap = mountTrap(c);
    trap.activate();
    await nextTick();
    trap.activate();
    expect(trap.isActive.value).toBe(true);
  });

  it('Tab on last focusable wraps to first', async () => {
    const c = makeContainer([{ tag: 'button' }, { tag: 'button' }, { tag: 'button' }]);
    const buttons = c.querySelectorAll('button');
    const trap = mountTrap(c);
    trap.activate();
    await nextTick();

    // Simulate "last element focused" by setting activeElement to last button
    (buttons[2] as HTMLElement).focus();
    expect(document.activeElement).toBe(buttons[2]);

    const evt = fireDocKey('Tab');
    expect(evt.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('Shift+Tab on first focusable wraps to last', async () => {
    const c = makeContainer([{ tag: 'button' }, { tag: 'button' }, { tag: 'button' }]);
    const buttons = c.querySelectorAll('button');
    const trap = mountTrap(c);
    trap.activate();
    await nextTick();

    (buttons[0] as HTMLElement).focus();
    expect(document.activeElement).toBe(buttons[0]);

    const evt = fireDocKey('Tab', { shiftKey: true });
    expect(evt.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(buttons[2]);
  });

  it('Tab in the middle does NOT wrap', async () => {
    const c = makeContainer([{ tag: 'button' }, { tag: 'button' }, { tag: 'button' }]);
    const buttons = c.querySelectorAll('button');
    const trap = mountTrap(c);
    trap.activate();
    await nextTick();

    (buttons[1] as HTMLElement).focus();
    const evt = fireDocKey('Tab');
    expect(evt.defaultPrevented).toBe(false);
  });

  it('Escape deactivates by default', async () => {
    const c = makeContainer([{ tag: 'button' }]);
    const trap = mountTrap(c);
    trap.activate();
    await nextTick();
    expect(trap.isActive.value).toBe(true);

    fireDocKey('Escape');
    expect(trap.isActive.value).toBe(false);
  });

  it('Escape does NOT deactivate when escapeDeactivates is false', async () => {
    const c = makeContainer([{ tag: 'button' }]);
    const trap = mountTrap(c, { escapeDeactivates: false });
    trap.activate();
    await nextTick();

    fireDocKey('Escape');
    expect(trap.isActive.value).toBe(true);
  });

  it('deactivate restores focus to the previously focused element', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const c = makeContainer([{ tag: 'button' }]);
    const trap = mountTrap(c);
    trap.activate();
    await nextTick();

    // Focus is now on the first focusable
    expect(document.activeElement).not.toBe(trigger);

    trap.deactivate();
    expect(document.activeElement).toBe(trigger);
  });

  it('invokes onDeactivate callback', async () => {
    const c = makeContainer([{ tag: 'button' }]);
    const onDeactivate = vi.fn();
    const trap = mountTrap(c, { onDeactivate });
    trap.activate();
    await nextTick();
    trap.deactivate();
    expect(onDeactivate).toHaveBeenCalledTimes(1);
  });

  it('clickOutsideDeactivates: click outside container deactivates', async () => {
    const c = makeContainer([{ tag: 'button' }]);
    const trap = mountTrap(c, { clickOutsideDeactivates: true });
    trap.activate();
    await nextTick();

    const outside = document.createElement('div');
    document.body.appendChild(outside);
    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(trap.isActive.value).toBe(false);
  });

  it('clickInside does NOT deactivate when clickOutsideDeactivates is set', async () => {
    const c = makeContainer([{ tag: 'button' }]);
    const inside = c.querySelector('button')!;
    const trap = mountTrap(c, { clickOutsideDeactivates: true });
    trap.activate();
    await nextTick();

    inside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(trap.isActive.value).toBe(true);
  });
});

// =================================================================
// useEscapeKey
// =================================================================

describe('useEscapeKey', () => {
  it('calls handler when Escape is pressed (enabled default)', () => {
    const handler = vi.fn();
    mount(
      defineComponent({
        setup() {
          useEscapeKey(handler);
          return () => h('div');
        },
      }),
      { attachTo: document.body },
    );
    fireDocKey('Escape');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not call handler for non-Escape keys', () => {
    const handler = vi.fn();
    mount(
      defineComponent({
        setup() {
          useEscapeKey(handler);
          return () => h('div');
        },
      }),
      { attachTo: document.body },
    );
    fireDocKey('Enter');
    fireDocKey('Space');
    expect(handler).not.toHaveBeenCalled();
  });

  it('respects enabled ref = false', async () => {
    const handler = vi.fn();
    const enabled = ref(true);
    mount(
      defineComponent({
        setup() {
          useEscapeKey(handler, enabled);
          return () => h('div');
        },
      }),
      { attachTo: document.body },
    );
    fireDocKey('Escape');
    expect(handler).toHaveBeenCalledTimes(1);

    enabled.value = false;
    await nextTick();
    fireDocKey('Escape');
    expect(handler).toHaveBeenCalledTimes(1); // not called again
  });

  it('removeListener detaches the handler', () => {
    const handler = vi.fn();
    let removeListener: () => void = () => {};
    mount(
      defineComponent({
        setup() {
          const result = useEscapeKey(handler);
          removeListener = result.removeListener;
          return () => h('div');
        },
      }),
      { attachTo: document.body },
    );
    fireDocKey('Escape');
    expect(handler).toHaveBeenCalledTimes(1);

    removeListener();
    fireDocKey('Escape');
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

// =================================================================
// useAnnouncer
// =================================================================

describe('useAnnouncer', () => {
  it('exposes announce and Announcer', () => {
    let announcerApi: ReturnType<typeof useAnnouncer> | null = null;
    mount(
      defineComponent({
        setup() {
          announcerApi = useAnnouncer();
          return () => h('div');
        },
      }),
      { attachTo: document.body },
    );
    expect(announcerApi).not.toBeNull();
    expect(typeof announcerApi!.announce).toBe('function');
    expect(announcerApi!.Announcer).toBeDefined();
  });

  it('announce updates the message', async () => {
    let announcerApi: ReturnType<typeof useAnnouncer> | null = null;
    mount(
      defineComponent({
        setup() {
          announcerApi = useAnnouncer();
          // Render the Announcer so the ref is bound
          return () => h('div', [h(announcerApi!.Announcer)]);
        },
      }),
      { attachTo: document.body },
    );
    announcerApi!.announce('Hello world');
    await nextTick();
    await nextTick();
    const live = document.querySelector('[aria-live="polite"]');
    expect(live?.textContent).toBe('Hello world');
  });

  it('Announcer renders an aria-live polite region', () => {
    let announcerApi: ReturnType<typeof useAnnouncer> | null = null;
    mount(
      defineComponent({
        setup() {
          announcerApi = useAnnouncer();
          return () => h('div', [h(announcerApi!.Announcer)]);
        },
      }),
      { attachTo: document.body },
    );
    const live = document.querySelector('[aria-live="polite"]');
    expect(live).not.toBeNull();
    expect(live!.getAttribute('aria-atomic')).toBe('true');
  });
});

// =================================================================
// getFocusableElements
// =================================================================

describe('getFocusableElements', () => {
  it('returns empty array for null', () => {
    expect(getFocusableElements(null)).toEqual([]);
  });

  it('returns buttons, links, inputs, selects, textareas', () => {
    const c = makeContainer([
      { tag: 'button' },
      { tag: 'a', attrs: { href: '#' } },
      { tag: 'input' },
      { tag: 'select' },
      { tag: 'textarea' },
    ]);
    const result = getFocusableElements(c);
    expect(result).toHaveLength(5);
  });

  it('skips disabled buttons and inputs', () => {
    const c = makeContainer([
      { tag: 'button' },
      { tag: 'button', attrs: { disabled: '' } },
      { tag: 'input' },
      { tag: 'input', attrs: { disabled: '' } },
    ]);
    const result = getFocusableElements(c);
    expect(result).toHaveLength(2);
  });

  it('skips hidden inputs', () => {
    const c = makeContainer([{ tag: 'input' }, { tag: 'input', attrs: { type: 'hidden' } }]);
    const result = getFocusableElements(c);
    expect(result).toHaveLength(1);
  });

  it('skips elements with tabindex="-1"', () => {
    const c = makeContainer([{ tag: 'button' }, { tag: 'div', attrs: { tabindex: '-1' } }]);
    const result = getFocusableElements(c);
    expect(result).toHaveLength(1);
  });

  it('includes contenteditable elements', () => {
    const c = makeContainer([{ tag: 'div', attrs: { contenteditable: 'true' } }]);
    const result = getFocusableElements(c);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});

// =================================================================
// isElementFocused
// =================================================================

describe('isElementFocused', () => {
  it('returns false for null', () => {
    expect(isElementFocused(null)).toBe(false);
  });

  it('returns true when element is activeElement', () => {
    const b = document.createElement('button');
    document.body.appendChild(b);
    b.focus();
    expect(isElementFocused(b)).toBe(true);
  });

  it('returns false when element is not activeElement', () => {
    const b = document.createElement('button');
    document.body.appendChild(b);
    expect(isElementFocused(b)).toBe(false);
  });
});

// =================================================================
// useKeyboardNavigation
// =================================================================

describe('useKeyboardNavigation', () => {
  it('ArrowRight moves focus to next focusable', async () => {
    const c = makeContainer([{ tag: 'button' }, { tag: 'button' }, { tag: 'button' }]);
    const buttons = c.querySelectorAll('button');
    const onNavigate = vi.fn();

    mount(
      defineComponent({
        setup() {
          const containerRef = ref<HTMLElement | null>(c);
          useKeyboardNavigation(containerRef, { onNavigate, loop: true });
          return () => h('div');
        },
      }),
      { attachTo: document.body },
    );

    (buttons[0] as HTMLElement).focus();
    fireContainerKey(c, 'ArrowRight');
    expect(document.activeElement).toBe(buttons[1]);
    expect(onNavigate).toHaveBeenCalledWith(buttons[1], 'next');
  });

  it('ArrowLeft moves focus to previous focusable', async () => {
    const c = makeContainer([{ tag: 'button' }, { tag: 'button' }, { tag: 'button' }]);
    const buttons = c.querySelectorAll('button');

    mount(
      defineComponent({
        setup() {
          const containerRef = ref<HTMLElement | null>(c);
          useKeyboardNavigation(containerRef, { loop: true });
          return () => h('div');
        },
      }),
      { attachTo: document.body },
    );

    (buttons[1] as HTMLElement).focus();
    fireContainerKey(c, 'ArrowLeft');
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('ArrowDown also moves forward (next)', async () => {
    const c = makeContainer([{ tag: 'button' }, { tag: 'button' }]);
    const buttons = c.querySelectorAll('button');

    mount(
      defineComponent({
        setup() {
          const containerRef = ref<HTMLElement | null>(c);
          useKeyboardNavigation(containerRef, { loop: true });
          return () => h('div');
        },
      }),
      { attachTo: document.body },
    );

    (buttons[0] as HTMLElement).focus();
    fireContainerKey(c, 'ArrowDown');
    expect(document.activeElement).toBe(buttons[1]);
  });

  it('ArrowUp also moves backward (prev)', async () => {
    const c = makeContainer([{ tag: 'button' }, { tag: 'button' }]);
    const buttons = c.querySelectorAll('button');

    mount(
      defineComponent({
        setup() {
          const containerRef = ref<HTMLElement | null>(c);
          useKeyboardNavigation(containerRef, { loop: true });
          return () => h('div');
        },
      }),
      { attachTo: document.body },
    );

    (buttons[1] as HTMLElement).focus();
    fireContainerKey(c, 'ArrowUp');
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('loops from last to first', async () => {
    const c = makeContainer([{ tag: 'button' }, { tag: 'button' }]);
    const buttons = c.querySelectorAll('button');

    mount(
      defineComponent({
        setup() {
          const containerRef = ref<HTMLElement | null>(c);
          useKeyboardNavigation(containerRef, { loop: true });
          return () => h('div');
        },
      }),
      { attachTo: document.body },
    );

    (buttons[1] as HTMLElement).focus();
    fireContainerKey(c, 'ArrowRight');
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('does not loop when loop: false', async () => {
    const c = makeContainer([{ tag: 'button' }, { tag: 'button' }]);
    const buttons = c.querySelectorAll('button');

    mount(
      defineComponent({
        setup() {
          const containerRef = ref<HTMLElement | null>(c);
          useKeyboardNavigation(containerRef, { loop: false });
          return () => h('div');
        },
      }),
      { attachTo: document.body },
    );

    (buttons[1] as HTMLElement).focus();
    fireContainerKey(c, 'ArrowRight');
    // Stays on last; cannot advance
    expect(document.activeElement).toBe(buttons[1]);
  });
});
