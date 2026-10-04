import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Digit, SevenSegmentDigit } from '../seven-segment-digit/seven-segment-digit';

@Component({
  selector: 'app-seven-segment-display',
  imports: [SevenSegmentDigit],
  templateUrl: './seven-segment-display.html',
  styleUrl: './seven-segment-display.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'img',
    '[attr.aria-label]': 'accessibleValue()',
    '[class.is-hidden]': 'hidden()',
  },
})
export class SevenSegmentDisplay {
  readonly value = input('00.00');
  readonly hidden = input(false);
  readonly message = input('');

  protected readonly characters = computed<readonly (Digit | '.')[]>(() => {
    const value = this.value().trim().replace(',', '.');
    const normalized = /^\d+(?:\.\d+)?$/.test(value) ? value : '00.00';
    return Array.from(normalized) as (Digit | '.')[];
  });
  protected readonly accessibleValue = computed(() =>
    this.hidden()
      ? 'Visor oculto'
      : `Visor: ${this.message() || this.characters().join('').replace('.', ',')}`,
  );
}
