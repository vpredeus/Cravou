import { TestBed } from '@angular/core/testing';
import { SevenSegmentDisplay } from './seven-segment-display';

describe('SevenSegmentDisplay', () => {
  it('can present an external message without showing a numeric result', async () => {
    const fixture = TestBed.createComponent(SevenSegmentDisplay);
    fixture.componentRef.setInput('value', '30.00');
    fixture.componentRef.setInput('message', 'DNF');
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.getAttribute('aria-label')).toBe('Visor: DNF');
    expect(element.querySelector('.display-message')?.textContent).toBe('DNF');
    expect(element.querySelector<HTMLElement>('.digits')?.style.visibility).toBe('hidden');
    fixture.componentRef.setInput('hidden', true);
    await fixture.whenStable();
    expect(element.querySelector('.display-message')).toBeNull();
    expect(element.querySelector('.concealed-glow')).not.toBeNull();
    expect(element.getAttribute('aria-label')).toBe('Visor oculto');
    fixture.componentRef.setInput('hidden', false);
    fixture.componentRef.setInput('message', '');
    await fixture.whenStable();
    expect(element.getAttribute('aria-label')).toBe('Visor: 30,00');
    expect(element.querySelector('.display-message')).toBeNull();
  });
  it.each([
    ['12.33', ['BC', 'ABDEG', 'ABCDG', 'ABCDG']],
    ['07.41', ['ABCDEF', 'ABC', 'BCFG', 'BC']],
    ['00.00', ['ABCDEF', 'ABCDEF', 'ABCDEF', 'ABCDEF']],
  ])('renders the correct segments for %s', async (value, expected) => {
    const fixture = TestBed.createComponent(SevenSegmentDisplay);
    fixture.componentRef.setInput('value', value);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    const segments = Array.from(element.querySelectorAll('app-seven-segment-digit')).map((digit) =>
      Array.from(digit.querySelectorAll('.segment-on'))
        .map((segment) => segment.getAttribute('data-segment'))
        .join(''),
    );
    expect(segments).toEqual(expected);
    expect(element.querySelectorAll('.decimal circle')).toHaveLength(1);
  });

  it('normalizes comma and dot to the same decimal separator', async () => {
    const fixture = TestBed.createComponent(SevenSegmentDisplay);
    fixture.componentRef.setInput('value', '12,33');
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.getAttribute('aria-label')).toBe('Visor: 12,33');
    expect(element.querySelectorAll('app-seven-segment-digit')).toHaveLength(4);
    expect(element.querySelectorAll('.decimal')).toHaveLength(1);
  });

  it('keeps illuminated segments mounted while hiding the value visually and accessibly', async () => {
    const fixture = TestBed.createComponent(SevenSegmentDisplay);
    fixture.componentRef.setInput('value', '07.41');
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const illuminated = Array.from(element.querySelectorAll('.segment-on'));

    fixture.componentRef.setInput('hidden', true);
    await fixture.whenStable();
    expect(element.classList.contains('is-hidden')).toBe(true);
    expect(element.getAttribute('aria-label')).toBe('Visor oculto');
    expect(element.querySelector('.digits')?.getAttribute('aria-hidden')).toBe('true');
    const digits = element.querySelector<HTMLElement>('.digits')!;
    expect(digits.style.visibility).toBe('hidden');
    expect(digits.style.opacity).toBe('0');
    expect(element.querySelector('.concealed-glow')).not.toBeNull();
    expect(Array.from(element.querySelectorAll('.segment-on'))).toEqual(illuminated);

    fixture.componentRef.setInput('hidden', false);
    await fixture.whenStable();
    expect(element.classList.contains('is-hidden')).toBe(false);
    expect(element.getAttribute('aria-label')).toBe('Visor: 07,41');
    expect(digits.style.visibility).toBe('');
    expect(digits.style.opacity).toBe('');
    expect(element.querySelector('.concealed-glow')).toBeNull();
  });

  it('uses the same independent concealed glow for different real values', async () => {
    const fixture = TestBed.createComponent(SevenSegmentDisplay);
    fixture.componentRef.setInput('hidden', true);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const glow = element.querySelector('.concealed-glow')!;
    const concealedMarkup = glow.outerHTML;
    const litSegmentCounts: number[] = [];

    for (const value of ['12.33', '88.88', '00.00']) {
      fixture.componentRef.setInput('value', value);
      await fixture.whenStable();
      expect(element.querySelector('.concealed-glow')).toBe(glow);
      expect(glow.outerHTML).toBe(concealedMarkup);
      expect(glow.textContent).toBe('');
      expect(glow.querySelector('svg, app-seven-segment-digit')).toBeNull();
      expect(element.querySelector<HTMLElement>('.digits')!.style.opacity).toBe('0');
      expect(element.getAttribute('aria-label')).toBe('Visor oculto');
      litSegmentCounts.push(element.querySelectorAll('.segment-on').length);
    }

    expect(new Set(litSegmentCounts).size).toBe(3);
  });

  it('updates externally supplied values', async () => {
    const fixture = TestBed.createComponent(SevenSegmentDisplay);
    await fixture.whenStable();
    fixture.componentRef.setInput('value', '88.88');
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('.segment-on')).toHaveLength(28);
  });

  it('uses the documented fallback for an invalid display value', async () => {
    const fixture = TestBed.createComponent(SevenSegmentDisplay);
    fixture.componentRef.setInput('value', 'invalid');
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).getAttribute('aria-label')).toBe('Visor: 00,00');
  });
});
