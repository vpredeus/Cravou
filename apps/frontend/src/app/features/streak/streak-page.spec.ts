import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { ButtonSound } from '../../shared/components/action-button/button-sound';
import { PreferencesStore } from '../../shared/preferences/preferences-store';
import { StreakGame } from './streak-game';
import { StreakPage } from './streak-page';

function press(button: HTMLButtonElement, pointerType = 'mouse'): void {
  button.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      pointerId: 1,
      isPrimary: true,
      button: 0,
      pointerType,
    }),
  );
  window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1 }));
  button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
}

function space(
  type: 'keydown' | 'keyup',
  target: EventTarget = document.body,
  repeat = false,
): KeyboardEvent {
  const event = new KeyboardEvent(type, {
    key: ' ',
    code: 'Space',
    bubbles: true,
    cancelable: true,
    repeat,
  });
  target.dispatchEvent(event);
  return event;
}

describe('StreakPage', () => {
  let fixture: ComponentFixture<StreakPage>;
  let element: HTMLElement;
  let game: StreakGame;
  let button: HTMLButtonElement;
  let now: number;

  beforeEach(async () => {
    vi.stubGlobal('Audio', undefined);
    vi.spyOn(Math, 'random').mockReturnValue((1233 - 10 + 0.5) / 1991);
    fixture = TestBed.createComponent(StreakPage);
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
    game = fixture.debugElement.injector.get(StreakGame);
    button = element.querySelector<HTMLButtonElement>('app-action-button button')!;
    now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('starts READY with a generated target, empty ranking and no debug toolbar', () => {
    expect(element.querySelector('.target')?.textContent).toContain('12,33');
    expect(element.querySelector('.streak-count')?.textContent).toBe('0');
    expect(element.querySelector('.empty-best')?.textContent).toContain('Nenhuma sequência ainda');
    expect(element.querySelector('.best li')).toBeNull();
    expect(element.querySelector('footer, .controls')).toBeNull();
    expect(element.querySelector('app-seven-segment-display')?.getAttribute('aria-label')).toBe(
      'Visor: 00,00',
    );
  });

  it('uses touch START and Space STOP once, preserves concealment, displays a hit and requires nextAttempt', async () => {
    const play = vi.spyOn(ButtonSound.prototype, 'play').mockResolvedValue(undefined);
    press(button, 'touch');
    await fixture.whenStable();
    expect(game.timer.state()).toBe('RUNNING');
    expect(element.querySelector('app-seven-segment-display')?.getAttribute('aria-label')).toBe(
      'Visor oculto',
    );
    expect(element.querySelector<HTMLElement>('.digits')?.style.visibility).toBe('hidden');
    expect(element.querySelector('.concealed-glow')).not.toBeNull();
    now = 12337;
    expect(space('keydown').defaultPrevented).toBe(true);
    space('keydown', document.body, true);
    space('keyup');
    await fixture.whenStable();
    expect(play.mock.calls).toEqual([['start'], ['end']]);
    expect(element.querySelector('app-seven-segment-display')?.getAttribute('aria-label')).toBe(
      'Visor: 12,33',
    );
    expect(element.querySelector('.attempt-status')?.textContent).toContain('CRAVOU!');
    expect(element.querySelector('.streak-count')?.textContent).toBe('1');
    expect(element.querySelector('.best li')).toBeNull();
    expect(button.disabled).toBe(true);
    button.click();
    expect(play).toHaveBeenCalledTimes(2);
    element.querySelector<HTMLButtonElement>('.next-attempt')!.click();
    await fixture.whenStable();
    expect(game.timer.state()).toBe('READY');
    expect(game.currentStreak()).toBe(1);
    expect(game.result()).toBeNull();
    expect(element.querySelector('app-seven-segment-display')?.getAttribute('aria-label')).toBe(
      'Visor: 00,00',
    );
    expect(button.disabled).toBe(false);
    expect(document.activeElement).toBe(button);
  });

  it.each([
    [12370, '+0,04 s'],
    [12310, '-0,02 s'],
  ])('reveals ERROU and the signed difference after %s ms', async (elapsed, difference) => {
    press(button);
    await fixture.whenStable();
    now = elapsed;
    press(button);
    await fixture.whenStable();
    expect(game.result()?.status).toBe('ERROU');
    expect(element.querySelector('.attempt-status')?.textContent).toContain('ERROU');
    expect(element.querySelector('.difference')?.textContent).toBe(difference);
    expect(element.querySelector('.concealed-glow')).toBeNull();
    expect(element.querySelector('.streak-count')?.textContent).toBe('0');
  });

  it('ignores held Space repeats until a distinct STOP press', async () => {
    space('keydown');
    await fixture.whenStable();
    space('keydown', document.body, true);
    space('keydown', document.body, true);
    await fixture.whenStable();
    expect(game.timer.state()).toBe('RUNNING');
    space('keyup');
    now = 12337;
    space('keydown');
    space('keyup');
    await fixture.whenStable();
    expect(game.result()?.status).toBe('CRAVOU');
  });

  it('keeps Settings and nickname Space separate from the game shortcut', async () => {
    const event = new Event('beforetoggle');
    Object.defineProperty(event, 'newState', { value: 'open' });
    element.querySelector('[popover]')!.dispatchEvent(event);
    await fixture.whenStable();
    const nickname = element.querySelector<HTMLInputElement>('#session-nickname')!;
    nickname.value = 'Ana Maria';
    nickname.dispatchEvent(new Event('input'));
    expect(space('keydown', nickname).defaultPrevented).toBe(false);
    space('keyup', nickname);
    space('keydown');
    space('keyup');
    await fixture.whenStable();
    expect(TestBed.inject(PreferencesStore).profile().nickname).toBe('Ana Maria');
    expect(game.timer.state()).toBe('READY');
    expect(button.disabled).toBe(true);
    expect(
      Array.from(element.querySelectorAll('app-settings-panel h3')).map(
        (section) => section.textContent,
      ),
    ).toEqual(['PERFIL', 'APARÊNCIA', 'SOM']);
  });

  it('mutes START/STOP through existing Settings and restores both sounds', async () => {
    const play = vi.spyOn(ButtonSound.prototype, 'play').mockResolvedValue(undefined);
    const preferences = TestBed.inject(PreferencesStore);
    element.querySelector<HTMLButtonElement>('[role="switch"]')!.click();
    await fixture.whenStable();
    expect(preferences.soundEnabled()).toBe(false);
    press(button);
    await fixture.whenStable();
    now = 12340;
    press(button);
    await fixture.whenStable();
    expect(play).not.toHaveBeenCalled();
    element.querySelector<HTMLButtonElement>('.next-attempt')!.click();
    element.querySelector<HTMLButtonElement>('[role="switch"]')!.click();
    await fixture.whenStable();
    press(button);
    await fixture.whenStable();
    now += 12337;
    press(button);
    await fixture.whenStable();
    expect(play.mock.calls).toEqual([['start'], ['end']]);
  });

  it('reveals DNF automatically, without a fake 30,00 result or an extra sound', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const play = vi.spyOn(ButtonSound.prototype, 'play').mockResolvedValue(undefined);
    press(button);
    fixture.detectChanges();
    now = 29999;
    vi.advanceTimersByTime(29999);
    fixture.detectChanges();
    expect(game.timer.state()).toBe('RUNNING');
    now = 30000;
    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(game.timer.state()).toBe('TIMED_OUT');
    expect(element.querySelector('app-seven-segment-display')?.getAttribute('aria-label')).toBe(
      'Visor: DNF',
    );
    expect(element.querySelector('.attempt-status')?.textContent).toContain('TEMPO ESGOTADO');
    expect(element.querySelector('.attempt-status')?.textContent).not.toContain('30,00');
    expect(element.querySelector('.concealed-glow')).toBeNull();
    expect(element.querySelector('.next-attempt')).not.toBeNull();
    expect(button.disabled).toBe(true);
    expect(play.mock.calls).toEqual([['start']]);
  });
});

describe('Streak route', () => {
  beforeEach(() => vi.stubGlobal('Audio', undefined));
  afterEach(() => vi.unstubAllGlobals());

  it('loads the actual Streak experience from the root route', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/', StreakPage);
    expect(harness.routeNativeElement?.querySelector('app-game-device')).not.toBeNull();
    expect(harness.routeNativeElement?.querySelector('.mode')?.textContent).toContain('STREAK');
  });
});
