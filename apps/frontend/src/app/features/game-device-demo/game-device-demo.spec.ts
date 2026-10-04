import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../../app.routes';
import { GameDeviceDemo } from './game-device-demo';
import { ButtonSound } from '../../shared/components/action-button/button-sound';
import { TimerEngine } from '../../shared/timer/timer-engine';
import { PreferencesStore } from '../../shared/preferences/preferences-store';

function press(button: HTMLButtonElement): void {
  button.dispatchEvent(
    new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, isPrimary: true, button: 0 }),
  );
  window.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1 }));
  button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
}

function space(
  type: 'keydown' | 'keyup',
  repeat = false,
  target: EventTarget = document.body,
): KeyboardEvent {
  const event = new KeyboardEvent(type, {
    code: 'Space',
    key: ' ',
    bubbles: true,
    cancelable: true,
    repeat,
  });
  target.dispatchEvent(event);
  return event;
}

function settingsState(element: HTMLElement, open: boolean): void {
  const event = new Event('beforetoggle');
  Object.defineProperty(event, 'newState', { value: open ? 'open' : 'closed' });
  element.querySelector('[popover]')!.dispatchEvent(event);
}

describe('GameDeviceDemo', () => {
  beforeEach(() => vi.stubGlobal('Audio', undefined));
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('keeps the technical device demo on its isolated route', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/device-demo', GameDeviceDemo);
    expect(harness.routeNativeElement?.querySelector('app-game-device')).not.toBeNull();
  });

  it('removes the debug toolbar and starts with the fixed external target and zero value', async () => {
    const fixture = TestBed.createComponent(GameDeviceDemo);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('footer, .controls, .feedback, select')).toBeNull();
    expect(element.textContent).not.toContain('Ações registradas');
    expect(element.textContent).not.toContain('Revelar visor');
    expect(element.querySelector('.target')?.textContent).toContain('12,33');
    expect(element.querySelector('app-seven-segment-display')?.getAttribute('aria-label')).toBe(
      'Visor: 00,00',
    );
    expect(element.querySelector('app-action-button button')?.getAttribute('aria-label')).toBe(
      'Iniciar cronômetro',
    );
  });

  it('plays START and STOP once, hides while running, reveals the truncated result, and requires explicit reset', async () => {
    const play = vi.spyOn(ButtonSound.prototype, 'play').mockResolvedValue(undefined);
    const fixture = TestBed.createComponent(GameDeviceDemo);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const button = element.querySelector<HTMLButtonElement>('app-action-button button')!;
    const timer = fixture.debugElement.injector.get(TimerEngine);
    const clock = vi.spyOn(performance, 'now').mockReturnValue(100);

    press(button);
    await fixture.whenStable();
    expect(timer.state()).toBe('RUNNING');
    expect(play.mock.calls).toEqual([['start']]);
    expect(button.getAttribute('aria-label')).toBe('Parar cronômetro');
    expect(element.querySelector('app-seven-segment-display')?.getAttribute('aria-label')).toBe(
      'Visor oculto',
    );
    expect(element.querySelector<HTMLElement>('.digits')?.style.opacity).toBe('0');
    expect(element.querySelector('.concealed-glow')).not.toBeNull();

    clock.mockReturnValue(12437);
    expect(space('keydown').defaultPrevented).toBe(true);
    space('keydown', true);
    space('keyup');
    await fixture.whenStable();
    expect(timer.state()).toBe('FINISHED');
    expect(timer.elapsedCentiseconds()).toBe(1233);
    expect(play.mock.calls).toEqual([['start'], ['end']]);
    expect(element.querySelector('app-seven-segment-display')?.getAttribute('aria-label')).toBe(
      'Visor: 12,33',
    );
    expect(element.querySelector('.concealed-glow')).toBeNull();
    expect(button.disabled).toBe(true);
    button.click();
    expect(play.mock.calls).toEqual([['start'], ['end']]);
    expect(timer.state()).toBe('FINISHED');

    element.querySelector<HTMLButtonElement>('.restart-demo')!.click();
    await fixture.whenStable();
    expect(timer.state()).toBe('READY');
    expect(timer.elapsedCentiseconds()).toBe(0);
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-label')).toBe('Iniciar cronômetro');
    expect(element.querySelector('app-seven-segment-display')?.getAttribute('aria-label')).toBe(
      'Visor: 00,00',
    );
    expect(play.mock.calls).toEqual([['start'], ['end']]);
  });

  it('ignores held Space repeats while running and allows a distinct stop press', async () => {
    const play = vi.spyOn(ButtonSound.prototype, 'play').mockResolvedValue(undefined);
    const fixture = TestBed.createComponent(GameDeviceDemo);
    await fixture.whenStable();
    const timer = fixture.debugElement.injector.get(TimerEngine);
    vi.spyOn(performance, 'now').mockReturnValue(0);
    space('keydown');
    await fixture.whenStable();
    space('keydown', true);
    space('keydown', true);
    await fixture.whenStable();
    expect(timer.state()).toBe('RUNNING');
    expect(play.mock.calls).toEqual([['start']]);
    space('keyup');
    space('keydown');
    space('keyup');
    await fixture.whenStable();
    expect(timer.state()).toBe('FINISHED');
    expect(play.mock.calls).toEqual([['start'], ['end']]);
  });

  it('does not consume Space or control the timer while editing the nickname', async () => {
    const play = vi.spyOn(ButtonSound.prototype, 'play').mockResolvedValue(undefined);
    const fixture = TestBed.createComponent(GameDeviceDemo);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const nickname = element.querySelector<HTMLInputElement>('#session-nickname')!;
    expect(space('keydown', false, nickname).defaultPrevented).toBe(false);
    settingsState(element, true);
    await fixture.whenStable();
    nickname.value = 'Ana Maria';
    nickname.dispatchEvent(new Event('input'));
    expect(space('keydown', false, nickname).defaultPrevented).toBe(false);
    space('keyup', false, nickname);
    await fixture.whenStable();
    expect(TestBed.inject(PreferencesStore).profile().nickname).toBe('Ana Maria');
    expect(fixture.debugElement.injector.get(TimerEngine).state()).toBe('READY');
    expect(play).not.toHaveBeenCalled();
    expect(element.querySelector<HTMLButtonElement>('app-action-button button')!.disabled).toBe(
      true,
    );
    settingsState(element, false);
    await fixture.whenStable();
    expect(element.querySelector<HTMLButtonElement>('app-action-button button')!.disabled).toBe(
      false,
    );
  });

  it('mutes both cues via Settings and restores the preserved sounds after enabling them again', async () => {
    const play = vi.spyOn(ButtonSound.prototype, 'play').mockResolvedValue(undefined);
    const stop = vi.spyOn(ButtonSound.prototype, 'stop');
    const fixture = TestBed.createComponent(GameDeviceDemo);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const button = element.querySelector<HTMLButtonElement>('app-action-button button')!;
    const soundToggle = element.querySelector<HTMLButtonElement>('[role="switch"]')!;
    soundToggle.click();
    await fixture.whenStable();
    expect(stop).toHaveBeenCalledOnce();
    press(button);
    await fixture.whenStable();
    press(button);
    await fixture.whenStable();
    expect(play).not.toHaveBeenCalled();
    expect(fixture.debugElement.injector.get(TimerEngine).state()).toBe('FINISHED');
    element.querySelector<HTMLButtonElement>('.restart-demo')!.click();
    soundToggle.click();
    await fixture.whenStable();
    press(button);
    await fixture.whenStable();
    press(button);
    await fixture.whenStable();
    expect(play.mock.calls).toEqual([['start'], ['end']]);
  });
});
