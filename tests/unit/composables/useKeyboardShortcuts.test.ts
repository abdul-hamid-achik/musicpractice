import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { useKeyboardShortcuts } from '~/composables/useKeyboardShortcuts';

/**
 * useKeyboardShortcuts binds a `keydown` listener on `window` and dispatches
 * based on `e.code`:
 *   - Space       → onToggleMetronome
 *   - ArrowUp     → onBpmAdjust(+1)   (+5 with shift)
 *   - ArrowDown   → onBpmAdjust(-1)   (-5 with shift)
 *   - Escape      → onToggleSidebar
 *   - KeyP        → onTogglePause
 *
 * Events fired from INPUT/TEXTAREA/SELECT or contenteditable elements are
 * ignored.
 */

function mountWith(options: Parameters<typeof useKeyboardShortcuts>[0]) {
  return mount(
    defineComponent({
      setup() {
        useKeyboardShortcuts(options);
        return () => h('div');
      },
    }),
    { attachTo: document.body },
  );
}

function fireKey(
  code: string,
  opts: Partial<KeyboardEventInit> & { shiftKey?: boolean; target?: EventTarget | null } = {},
) {
  const event = new KeyboardEvent('keydown', {
    code,
    bubbles: true,
    cancelable: true,
    ...opts,
  } as KeyboardEventInit);
  if (opts.target) {
    Object.defineProperty(event, 'target', { value: opts.target, configurable: true });
  }
  window.dispatchEvent(event);
  return event;
}

beforeEach(() => {
  // Ensure no stray document body elements from previous tests
  document.body.innerHTML = '';
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('useKeyboardShortcuts', () => {
  describe('Space', () => {
    it('calls onToggleMetronome when Space is pressed on body', () => {
      const onToggleMetronome = vi.fn();
      mountWith({ onToggleMetronome });
      fireKey('Space');
      expect(onToggleMetronome).toHaveBeenCalledTimes(1);
    });

    it('does nothing if no onToggleMetronome handler is provided', () => {
      mountWith({});
      expect(() => fireKey('Space')).not.toThrow();
    });
  });

  describe('Arrow keys (BPM adjust)', () => {
    it('ArrowUp calls onBpmAdjust with +1 (no shift)', () => {
      const onBpmAdjust = vi.fn();
      mountWith({ onBpmAdjust });
      fireKey('ArrowUp');
      expect(onBpmAdjust).toHaveBeenCalledWith(1);
    });

    it('ArrowUp + Shift calls onBpmAdjust with +5', () => {
      const onBpmAdjust = vi.fn();
      mountWith({ onBpmAdjust });
      fireKey('ArrowUp', { shiftKey: true });
      expect(onBpmAdjust).toHaveBeenCalledWith(5);
    });

    it('ArrowDown calls onBpmAdjust with -1 (no shift)', () => {
      const onBpmAdjust = vi.fn();
      mountWith({ onBpmAdjust });
      fireKey('ArrowDown');
      expect(onBpmAdjust).toHaveBeenCalledWith(-1);
    });

    it('ArrowDown + Shift calls onBpmAdjust with -5', () => {
      const onBpmAdjust = vi.fn();
      mountWith({ onBpmAdjust });
      fireKey('ArrowDown', { shiftKey: true });
      expect(onBpmAdjust).toHaveBeenCalledWith(-5);
    });
  });

  describe('Escape', () => {
    it('calls onToggleSidebar when Escape is pressed', () => {
      const onToggleSidebar = vi.fn();
      mountWith({ onToggleSidebar });
      fireKey('Escape');
      expect(onToggleSidebar).toHaveBeenCalledTimes(1);
    });
  });

  describe('KeyP', () => {
    it('calls onTogglePause when KeyP is pressed', () => {
      const onTogglePause = vi.fn();
      mountWith({ onTogglePause });
      fireKey('KeyP');
      expect(onTogglePause).toHaveBeenCalledTimes(1);
    });
  });

  describe('ignored event sources', () => {
    it('does NOT fire onToggleMetronome when focus is in an INPUT', () => {
      const onToggleMetronome = vi.fn();
      mountWith({ onToggleMetronome });

      const input = document.createElement('input');
      document.body.appendChild(input);

      fireKey('Space', { target: input });
      expect(onToggleMetronome).not.toHaveBeenCalled();
    });

    it('does NOT fire onBpmAdjust when focus is in a TEXTAREA', () => {
      const onBpmAdjust = vi.fn();
      mountWith({ onBpmAdjust });

      const ta = document.createElement('textarea');
      document.body.appendChild(ta);

      fireKey('ArrowUp', { target: ta });
      expect(onBpmAdjust).not.toHaveBeenCalled();
    });

    it('does NOT fire onTogglePause when focus is in a SELECT', () => {
      const onTogglePause = vi.fn();
      mountWith({ onTogglePause });

      const sel = document.createElement('select');
      document.body.appendChild(sel);

      fireKey('KeyP', { target: sel });
      expect(onTogglePause).not.toHaveBeenCalled();
    });

    it('does NOT fire onToggleSidebar when focus is in a contenteditable', () => {
      const onToggleSidebar = vi.fn();
      mountWith({ onToggleSidebar });

      const div = document.createElement('div');
      div.setAttribute('contenteditable', 'true');
      // Mock isContentEditable on the element (KeyboardEvent target is
      // read-only so we can't set it via the event constructor).
      Object.defineProperty(div, 'isContentEditable', { value: true, configurable: true });
      document.body.appendChild(div);

      fireKey('Escape', { target: div });
      expect(onToggleSidebar).not.toHaveBeenCalled();
    });
  });

  describe('lifecycle', () => {
    it('removes the keydown listener on unmount', () => {
      const onToggleMetronome = vi.fn();
      const wrapper = mountWith({ onToggleMetronome });
      fireKey('Space');
      expect(onToggleMetronome).toHaveBeenCalledTimes(1);

      wrapper.unmount();
      fireKey('Space');
      expect(onToggleMetronome).toHaveBeenCalledTimes(1); // still 1, not 2
    });
  });
});
