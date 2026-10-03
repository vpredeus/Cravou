import { formatCentiseconds, millisecondsToCentiseconds } from './time';

describe('millisecondsToCentiseconds', () => {
  it.each([
    [0, 0],
    [9.999, 0],
    [10, 1],
    [12337, 1233],
    [12339, 1233],
    [12340, 1234],
    [12339.999, 1233],
  ])('truncates %s ms to %s integer centiseconds', (milliseconds, expected) => {
    expect(millisecondsToCentiseconds(milliseconds)).toBe(expected);
  });

  it.each([-1, NaN, Infinity])('rejects invalid elapsed milliseconds %s', (value) => {
    expect(() => millisecondsToCentiseconds(value)).toThrow(RangeError);
  });
});

describe('formatCentiseconds', () => {
  it.each([
    [0, '00.00'],
    [1, '00.01'],
    [99, '00.99'],
    [100, '01.00'],
    [741, '07.41'],
    [1233, '12.33'],
    [9999, '99.99'],
    [10000, '100.00'],
  ])('formats %s integer centiseconds as %s', (centiseconds, expected) => {
    expect(formatCentiseconds(centiseconds)).toBe(expected);
  });

  it.each([-1, 12.33, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid official values %s',
    (value) => {
      expect(() => formatCentiseconds(value)).toThrow(RangeError);
    },
  );
});
