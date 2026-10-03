import { TestBed } from '@angular/core/testing';
import { SettingsPanel } from './settings-panel';
import { PreferencesStore } from '../../preferences/preferences-store';

function popoverEvent(type: string, newState: 'open' | 'closed'): Event {
  const event = new Event(type);
  Object.defineProperty(event, 'newState', { value: newState });
  return event;
}

describe('SettingsPanel', () => {
  it('provides a native auto popover and the exact section order', async () => {
    const fixture = TestBed.createComponent(SettingsPanel);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('button')?.getAttribute('popovertarget')).toBe('game-settings');
    expect(element.querySelector('[role="dialog"]')?.getAttribute('popover')).toBe('auto');
    expect(
      Array.from(element.querySelectorAll('h3')).map((section) => section.textContent),
    ).toEqual(['PERFIL', 'APARÊNCIA', 'SOM']);
  });

  it('keeps expanded state and the container informed of native open/close events', async () => {
    const fixture = TestBed.createComponent(SettingsPanel);
    const opened = vi.fn();
    fixture.componentInstance.openedChange.subscribe(opened);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const panel = element.querySelector('[popover]')!;
    panel.dispatchEvent(popoverEvent('beforetoggle', 'open'));
    await fixture.whenStable();
    expect(element.querySelector('button')?.getAttribute('aria-expanded')).toBe('true');
    panel.dispatchEvent(popoverEvent('beforetoggle', 'closed'));
    await fixture.whenStable();
    expect(element.querySelector('button')?.getAttribute('aria-expanded')).toBe('false');
    expect(opened.mock.calls).toEqual([[true], [false]]);
  });

  it('edits nickname, avatar and both appearance colors through labeled inputs', async () => {
    const fixture = TestBed.createComponent(SettingsPanel);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const preferences = TestBed.inject(PreferencesStore);
    const nickname = element.querySelector<HTMLInputElement>('#session-nickname')!;
    nickname.value = 'Ana Maria';
    nickname.dispatchEvent(new Event('input'));
    const avatar = element.querySelector<HTMLInputElement>('input[value="wave"]')!;
    avatar.checked = true;
    avatar.dispatchEvent(new Event('change'));
    const accent = element.querySelector<HTMLInputElement>('#display-color')!;
    accent.value = '#66c9ff';
    accent.dispatchEvent(new Event('input'));
    const background = element.querySelector<HTMLInputElement>('#background-color')!;
    background.value = '#162030';
    background.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(preferences.profile()).toEqual({ nickname: 'Ana Maria', avatarId: 'wave' });
    expect(preferences.accentColor()).toBe('#66c9ff');
    expect(preferences.backgroundColor()).toBe('#162030');
    expect(element.querySelector('app-profile-avatar')).not.toBeNull();
  });

  it('toggles sound with an accessible switch', async () => {
    const fixture = TestBed.createComponent(SettingsPanel);
    await fixture.whenStable();
    const sound = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[role="switch"]',
    )!;
    expect(sound.getAttribute('aria-checked')).toBe('true');
    sound.click();
    await fixture.whenStable();
    expect(sound.getAttribute('aria-checked')).toBe('false');
    expect(TestBed.inject(PreferencesStore).soundEnabled()).toBe(false);
    sound.click();
    await fixture.whenStable();
    expect(sound.getAttribute('aria-checked')).toBe('true');
  });
});
