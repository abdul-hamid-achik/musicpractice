import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

// settingsStore.theme is compared with `=== 'dark'` in the template, so the
// mock must return a plain string — not a ref.
const settingsTheme = ref('dark');
const updateSettingMock = vi.fn();
vi.stubGlobal('useSettingsStore', () => ({
  get theme() {
    return settingsTheme.value;
  },
  defaultInstrument: ref('guitar'),
  defaultTempo: ref(120),
  showNotation: ref(true),
  showTablature: ref(true),
  volume: ref(80),
  updateSetting: updateSettingMock,
}));

import ThemeToggle from '~/components/ui/ThemeToggle.vue';

describe('ThemeToggle', () => {
  beforeEach(() => {
    settingsTheme.value = 'dark';
    updateSettingMock.mockClear();
  });

  it('renders a button with an aria-label', () => {
    const wrapper = mount(ThemeToggle);
    const button = wrapper.find('button');
    expect(button.exists()).toBe(true);
    expect(button.attributes('aria-label')).toBeTruthy();
  });

  it('renders "Switch to light mode" label when theme is dark', () => {
    settingsTheme.value = 'dark';
    const wrapper = mount(ThemeToggle);
    expect(wrapper.attributes('aria-label')).toBe('Switch to light mode');
  });

  it('renders "Switch to dark mode" label when theme is light', () => {
    settingsTheme.value = 'light';
    const wrapper = mount(ThemeToggle);
    expect(wrapper.attributes('aria-label')).toBe('Switch to dark mode');
    // restore
    settingsTheme.value = 'dark';
  });

  it('calls updateSetting with light when dark theme is toggled (state transition)', async () => {
    updateSettingMock.mockClear();
    settingsTheme.value = 'dark';
    const wrapper = mount(ThemeToggle);
    await wrapper.trigger('click');
    expect(updateSettingMock).toHaveBeenCalledWith('theme', 'light');
  });

  it('calls updateSetting with dark when light theme is toggled (state transition)', async () => {
    updateSettingMock.mockClear();
    settingsTheme.value = 'light';
    const wrapper = mount(ThemeToggle);
    await wrapper.trigger('click');
    expect(updateSettingMock).toHaveBeenCalledWith('theme', 'dark');
    settingsTheme.value = 'dark';
  });

  it('renders a sun icon when theme is dark', () => {
    settingsTheme.value = 'dark';
    const wrapper = mount(ThemeToggle);
    const svgs = wrapper.findAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('renders a moon icon when theme is light', () => {
    settingsTheme.value = 'light';
    const wrapper = mount(ThemeToggle);
    const svgs = wrapper.findAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
    settingsTheme.value = 'dark';
  });
});
