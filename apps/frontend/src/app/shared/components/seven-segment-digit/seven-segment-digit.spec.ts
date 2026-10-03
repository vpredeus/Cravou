import { TestBed } from '@angular/core/testing';
import { Digit, SevenSegmentDigit } from './seven-segment-digit';

const expectedSegments: readonly [Digit, string][] = [
  ['0', 'ABCDEF'],
  ['1', 'BC'],
  ['2', 'ABDEG'],
  ['3', 'ABCDG'],
  ['4', 'BCFG'],
  ['5', 'ACDFG'],
  ['6', 'ACDEFG'],
  ['7', 'ABC'],
  ['8', 'ABCDEFG'],
  ['9', 'ABCDFG'],
];

describe('SevenSegmentDigit', () => {
  it.each(expectedSegments)('renders the seven independent segments for %s', async (digit, on) => {
    const fixture = TestBed.createComponent(SevenSegmentDigit);
    fixture.componentRef.setInput('digit', digit);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const segments = Array.from(element.querySelectorAll('polygon'));

    expect(segments).toHaveLength(7);
    expect(
      segments
        .filter((s) => s.classList.contains('segment-on'))
        .map((s) => s.getAttribute('data-segment'))
        .join(''),
    ).toBe(on);
    expect(segments.filter((s) => !s.classList.contains('segment-on'))).toHaveLength(7 - on.length);
  });

  it('updates the lit segments when its input changes', async () => {
    const fixture = TestBed.createComponent(SevenSegmentDigit);
    fixture.componentRef.setInput('digit', '8');
    await fixture.whenStable();
    fixture.componentRef.setInput('digit', '1');
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(
      Array.from(element.querySelectorAll('.segment-on')).map((s) =>
        s.getAttribute('data-segment'),
      ),
    ).toEqual(['B', 'C']);
  });
});
