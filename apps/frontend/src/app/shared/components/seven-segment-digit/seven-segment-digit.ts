import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
export type Segment = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export const DIGIT_SEGMENTS: Readonly<Record<Digit, readonly Segment[]>> = {
  '0': ['A', 'B', 'C', 'D', 'E', 'F'],
  '1': ['B', 'C'],
  '2': ['A', 'B', 'D', 'E', 'G'],
  '3': ['A', 'B', 'C', 'D', 'G'],
  '4': ['B', 'C', 'F', 'G'],
  '5': ['A', 'C', 'D', 'F', 'G'],
  '6': ['A', 'C', 'D', 'E', 'F', 'G'],
  '7': ['A', 'B', 'C'],
  '8': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  '9': ['A', 'B', 'C', 'D', 'F', 'G'],
};

@Component({
  selector: 'app-seven-segment-digit',
  templateUrl: './seven-segment-digit.html',
  styleUrl: './seven-segment-digit.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
})
export class SevenSegmentDigit {
  readonly digit = input.required<Digit>();
  protected readonly activeSegments = computed(() => DIGIT_SEGMENTS[this.digit()]);
  protected readonly segments: readonly { name: Segment; points: string }[] = [
    { name: 'A', points: '12,3 48,3 54,9 48,15 12,15 6,9' },
    { name: 'B', points: '50,16 56,10 56,48 50,54 44,48 44,22' },
    { name: 'C', points: '50,61 56,55 56,93 50,99 44,93 44,67' },
    { name: 'D', points: '12,93 48,93 54,99 48,105 12,105 6,99' },
    { name: 'E', points: '10,61 16,67 16,93 10,99 4,93 4,55' },
    { name: 'F', points: '10,16 16,22 16,48 10,54 4,48 4,10' },
    { name: 'G', points: '12,48 48,48 54,54 48,60 12,60 6,54' },
  ];
}
