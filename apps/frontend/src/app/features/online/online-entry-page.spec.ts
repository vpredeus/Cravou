import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PreferencesStore } from '../../shared/preferences/preferences-store';
import { OnlineEntryPage } from './online-entry-page';

describe('OnlineEntryPage shared profile', () => {
  let fixture: ComponentFixture<OnlineEntryPage>;
  let page: HTMLElement;
  let preferences: PreferencesStore;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(OnlineEntryPage);
    await fixture.whenStable();
    page = fixture.nativeElement as HTMLElement;
    preferences = TestBed.inject(PreferencesStore);
  });

  async function typeNickname(selector: string, value: string): Promise<void> {
    const input = page.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  it('shows the existing profile, local avatar choices and both online actions', () => {
    expect(page.querySelector<HTMLInputElement>('#online-nickname')?.value).toBe('Jogador');
    expect(page.querySelectorAll('input[name="online-avatar"]')).toHaveLength(4);
    expect(page.querySelector('a[href="/online/create"]')?.textContent).toContain('CRIAR GRUPO');
    expect(page.querySelector('a[href="/online/join"]')?.textContent).toContain('ENTRAR EM GRUPO');
  });

  it('updates the shared store when editing the online nickname', async () => {
    await typeNickname('#online-nickname', 'Ana Maria');
    expect(preferences.profile().nickname).toBe('Ana Maria');
  });

  it('reflects nickname changes from the shared store', async () => {
    preferences.setNickname('Caio');
    await fixture.whenStable();
    expect(page.querySelector<HTMLInputElement>('#online-nickname')?.value).toBe('Caio');
  });

  it('keeps avatar selections synchronized with the shared store', async () => {
    page.querySelector<HTMLInputElement>('input[name="online-avatar"][value="wave"]')!.click();
    await fixture.whenStable();
    expect(preferences.profile().avatarId).toBe('wave');
    preferences.setAvatar('bolt');
    await fixture.whenStable();
    expect(
      page.querySelector<HTMLInputElement>('input[name="online-avatar"][value="bolt"]')?.checked,
    ).toBe(true);
    expect(page.querySelectorAll('input[type="radio"]:checked')).toHaveLength(1);
  });

  it('retains the session preferences across entry navigation', async () => {
    preferences.setNickname('Nina');
    preferences.setAvatar('orbit');
    preferences.setAccentColor('#abcdef');
    preferences.setBackgroundColor('#123456');
    preferences.setSoundEnabled(false);
    fixture.destroy();
    fixture = TestBed.createComponent(OnlineEntryPage);
    await fixture.whenStable();
    page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector<HTMLInputElement>('#online-nickname')?.value).toBe('Nina');
    expect(
      page.querySelector<HTMLInputElement>('input[name="online-avatar"][value="orbit"]')?.checked,
    ).toBe(true);
    expect(preferences.accentColor()).toBe('#abcdef');
    expect(preferences.backgroundColor()).toBe('#123456');
    expect(preferences.soundEnabled()).toBe(false);
  });
});
