import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActionButton } from '../action-button/action-button';
import { SevenSegmentDisplay } from '../seven-segment-display/seven-segment-display';
import { GameDevice } from './game-device';

describe('GameDevice', () => {
  it('passes display and interaction inputs to the reusable children', async () => {
    const fixture = TestBed.createComponent(GameDevice);
    fixture.componentRef.setInput('value', '07.41');
    fixture.componentRef.setInput('displayHidden', true);
    fixture.componentRef.setInput('displayMessage', 'Mensagem externa');
    fixture.componentRef.setInput('buttonLabel', 'Testar dispositivo');
    fixture.componentRef.setInput('soundEnabled', false);
    fixture.componentRef.setInput('soundCue', 'end');
    fixture.componentRef.setInput('keyboardShortcut', true);
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    const display = fixture.debugElement.query(By.directive(SevenSegmentDisplay))
      .componentInstance as SevenSegmentDisplay;
    const button = fixture.debugElement.query(By.directive(ActionButton))
      .componentInstance as ActionButton;
    expect(display.value()).toBe('07.41');
    expect(display.hidden()).toBe(true);
    expect(display.message()).toBe('Mensagem externa');
    expect(button.label()).toBe('Testar dispositivo');
    expect(button.soundEnabled()).toBe(false);
    expect(button.soundCue()).toBe('end');
    expect(button.keyboardShortcut()).toBe(true);
    expect(button.disabled()).toBe(true);
  });

  it('forwards a generic button action without changing the display value', async () => {
    const fixture = TestBed.createComponent(GameDevice);
    fixture.componentRef.setInput('soundEnabled', false);
    const action = vi.fn();
    fixture.componentInstance.action.subscribe(action);
    await fixture.whenStable();
    (fixture.nativeElement as HTMLElement).querySelector('button')!.click();
    expect(action).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.value()).toBe('00.00');
  });
});
