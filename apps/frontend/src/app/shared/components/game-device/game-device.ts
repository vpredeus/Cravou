import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ActionButton } from '../action-button/action-button';
import { ButtonSoundCue } from '../action-button/button-sound';
import { SevenSegmentDisplay } from '../seven-segment-display/seven-segment-display';

@Component({
  selector: 'app-game-device',
  imports: [SevenSegmentDisplay, ActionButton],
  templateUrl: './game-device.html',
  styleUrl: './game-device.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameDevice {
  readonly value = input('00.00');
  readonly displayHidden = input(false);
  readonly buttonLabel = input('Acionar dispositivo');
  readonly disabled = input(false);
  readonly soundEnabled = input(true);
  readonly soundCue = input<ButtonSoundCue>('start');
  readonly keyboardShortcut = input(false);
  readonly action = output<void>();
}
