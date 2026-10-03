import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActionButton } from './action-button';
import { ButtonSound } from './button-sound';

describe('ActionButton', () => {
  let fixture: ComponentFixture<ActionButton>;
  let button: HTMLButtonElement;
  let action = vi.fn<() => void>();

  function key(
    type: 'keydown' | 'keyup',
    options: KeyboardEventInit = {},
    target: EventTarget = document.body,
  ): KeyboardEvent {
    const event = new KeyboardEvent(type, {
      key: ' ',
      code: 'Space',
      bubbles: true,
      cancelable: true,
      ...options,
    });
    target.dispatchEvent(event);
    return event;
  }

  function pointer(
    type: string,
    pointerType = 'mouse',
    options: PointerEventInit = {},
    target: EventTarget = button,
  ): void {
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        pointerId: 1,
        isPrimary: true,
        button: 0,
        pointerType,
        ...options,
      }),
    );
  }

  beforeEach(async () => {
    vi.stubGlobal('Audio', undefined);
    fixture = TestBed.createComponent(ActionButton);
    fixture.componentRef.setInput('soundEnabled', false);
    fixture.componentRef.setInput('keyboardShortcut', true);
    action = vi.fn<() => void>();
    fixture.componentInstance.action.subscribe(action);
    await fixture.whenStable();
    button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each(['mouse', 'touch', 'pen'])(
    'emits immediately and only once for a %s press and its click',
    (type) => {
      pointer('pointerdown', type);
      expect(action).toHaveBeenCalledTimes(1);
      pointer('pointerup', type);
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
      expect(action).toHaveBeenCalledTimes(1);
      pointer('pointerdown', type);
      expect(action).toHaveBeenCalledTimes(2);
    },
  );

  it('ignores a secondary pointer and right clicks', () => {
    pointer('pointerdown', 'mouse', { button: 2 });
    pointer('pointerdown', 'touch', { isPrimary: false, pointerId: 2 });
    expect(action).not.toHaveBeenCalled();
  });

  it('does not emit again while a pointer is held', () => {
    pointer('pointerdown');
    pointer('pointerdown');
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('accepts another press after pointer cancellation or release outside the button', () => {
    pointer('pointerdown');
    pointer('pointercancel', 'mouse', {}, window);
    pointer('pointerdown');
    pointer('pointerup', 'mouse', {}, window);
    pointer('pointerdown');
    expect(action).toHaveBeenCalledTimes(3);
  });

  it('prevents Space scrolling, ignores repeat and accepts a new press after release', () => {
    expect(key('keydown').defaultPrevented).toBe(true);
    expect(key('keydown', { repeat: true }).defaultPrevented).toBe(true);
    key('keydown');
    expect(action).toHaveBeenCalledTimes(1);
    key('keyup');
    key('keydown');
    expect(action).toHaveBeenCalledTimes(2);
  });

  it('does not activate for a repeat event without an initial press', () => {
    key('keydown', { repeat: true });
    expect(action).not.toHaveBeenCalled();
  });

  it('supports focused Space and Enter even without the document shortcut', async () => {
    fixture.componentRef.setInput('keyboardShortcut', false);
    await fixture.whenStable();
    key('keydown');
    expect(action).not.toHaveBeenCalled();
    key('keydown', {}, button);
    button.click();
    expect(action).toHaveBeenCalledTimes(1);
    key('keyup', {}, button);
    key('keydown', { key: 'Enter', code: 'Enter' }, button);
    key('keydown', { key: 'Enter', code: 'Enter', repeat: true }, button);
    expect(action).toHaveBeenCalledTimes(2);
  });

  it.each(['button', 'input', 'select', 'textarea', 'a', 'summary'])(
    'preserves Space on another %s',
    (tag) => {
      const target = document.createElement(tag);
      document.body.append(target);
      try {
        expect(key('keydown', {}, target).defaultPrevented).toBe(false);
        expect(action).not.toHaveBeenCalled();
      } finally {
        target.remove();
      }
    },
  );

  it('preserves shortcuts inside editable and custom interactive elements', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.append(child);
    document.body.append(parent);
    try {
      parent.setAttribute('contenteditable', 'true');
      expect(key('keydown', {}, child).defaultPrevented).toBe(false);
      parent.removeAttribute('contenteditable');
      parent.setAttribute('role', 'slider');
      expect(key('keydown', {}, child).defaultPrevented).toBe(false);
      expect(action).not.toHaveBeenCalled();
    } finally {
      parent.remove();
    }
  });

  it('ignores modified, composing and previously handled keyboard events', () => {
    for (const options of [
      { ctrlKey: true },
      { altKey: true },
      { metaKey: true },
      { isComposing: true },
    ]) {
      expect(key('keydown', options).defaultPrevented).toBe(false);
    }
    const handled = new KeyboardEvent('keydown', {
      key: ' ',
      code: 'Space',
      cancelable: true,
      bubbles: true,
    });
    handled.preventDefault();
    document.body.dispatchEvent(handled);
    expect(action).not.toHaveBeenCalled();
  });

  it('preserves assistive technology and programmatic button clicks', () => {
    button.click();
    expect(action).toHaveBeenCalledTimes(1);
    expect(button.type).toBe('button');
    expect(button.getAttribute('aria-label')).toBe('Acionar dispositivo');
    expect(button.textContent?.trim()).toBe('');
    expect(button.querySelector('svg')).toBeNull();
  });

  it('does not emit while disabled', async () => {
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    pointer('pointerdown');
    key('keydown');
    button.click();
    expect(button.disabled).toBe(true);
    expect(action).not.toHaveBeenCalled();
  });

  it('shows immediate press feedback and returns to its resting state', () => {
    vi.useFakeTimers();
    pointer('pointerdown');
    fixture.detectChanges();
    expect(button.classList.contains('is-pressed')).toBe(true);
    vi.advanceTimersByTime(200);
    fixture.detectChanges();
    expect(button.classList.contains('is-pressed')).toBe(false);
  });

  it('clears a held key when the window loses focus', () => {
    key('keydown');
    window.dispatchEvent(new Event('blur'));
    key('keydown');
    expect(action).toHaveBeenCalledTimes(2);
  });

  it('keeps the stop press feedback visible when the container disables a finished timer', () => {
    vi.useFakeTimers();
    pointer('pointerdown');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(button.classList.contains('is-pressed')).toBe(true);
    vi.advanceTimersByTime(200);
    fixture.detectChanges();
    expect(button.classList.contains('is-pressed')).toBe(false);
  });

  it('plays one sound through the same activation path and allows muting it', async () => {
    const play = vi.spyOn(ButtonSound.prototype, 'play').mockResolvedValue(undefined);
    fixture.componentRef.setInput('soundEnabled', true);
    await fixture.whenStable();
    pointer('pointerdown');
    pointer('pointerup');
    fixture.componentRef.setInput('soundCue', 'end');
    await fixture.whenStable();
    key('keydown');
    key('keyup');
    expect(play).toHaveBeenCalledTimes(2);
    expect(play.mock.calls).toEqual([['start'], ['end']]);
    fixture.componentRef.setInput('soundEnabled', false);
    await fixture.whenStable();
    button.click();
    expect(play).toHaveBeenCalledTimes(2);
  });

  it('removes document listeners and disposes audio on destruction', () => {
    const dispose = vi.spyOn(ButtonSound.prototype, 'dispose');
    fixture.destroy();
    key('keydown');
    expect(action).not.toHaveBeenCalled();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});
