import {
  evaluateAttempt,
  formatDifference,
  generateTarget,
  MAX_TARGET_CS,
  MIN_TARGET_CS,
  recordEndedStreak,
} from './streak-rules';

describe('Streak rules', () => {
  it('generates both inclusive integer endpoints directly in centiseconds', () => {
    expect(generateTarget(() => 0)).toBe(MIN_TARGET_CS);
    expect(generateTarget(() => 1 - Number.EPSILON)).toBe(MAX_TARGET_CS);
  });

  it.each([0, 0.0001, 0.1, 0.25, 0.5, 0.9, 0.999999])(
    'generates an in-range integer for RNG %s',
    (random) => {
      const target = generateTarget(() => random);
      expect(Number.isInteger(target)).toBe(true);
      expect(target).toBeGreaterThanOrEqual(10);
      expect(target).toBeLessThanOrEqual(2000);
    },
  );

  it('maps every RNG bin to its corresponding integer without converting seconds', () => {
    for (let target = MIN_TARGET_CS; target <= MAX_TARGET_CS; target++) {
      expect(
        generateTarget(() => (target - MIN_TARGET_CS + 0.5) / (MAX_TARGET_CS - MIN_TARGET_CS + 1)),
      ).toBe(target);
    }
  });

  it.each([
    [1233, 'CRAVOU', 0],
    [1234, 'ERROU', 1],
    [1232, 'ERROU', -1],
  ])('compares %s cs exactly against 1233 cs', (elapsed, status, difference) => {
    expect(evaluateAttempt(1233, elapsed)).toEqual({
      status,
      targetCentiseconds: 1233,
      elapsedCentiseconds: elapsed,
      differenceCentiseconds: difference,
    });
  });

  it.each([
    [4, '+0,04 s'],
    [-2, '-0,02 s'],
    [0, '0,00 s'],
    [1234, '+12,34 s'],
    [-100, '-1,00 s'],
  ])('formats signed difference %s as %s', (difference, expected) => {
    expect(formatDifference(difference)).toBe(expected);
  });

  it('records ended streaks in descending order, without mutating existing records', () => {
    const initial: readonly number[] = [];
    const first = recordEndedStreak(initial, 5);
    const second = recordEndedStreak(first, 8);
    expect(recordEndedStreak(second, 3)).toEqual([8, 5, 3]);
    expect(initial).toEqual([]);
    expect(first).toEqual([5]);
  });

  it('keeps only the five largest ended streaks, permits duplicates, and never adds zero', () => {
    expect(recordEndedStreak([14, 11, 8, 5, 3], 9)).toEqual([14, 11, 9, 8, 5]);
    expect(recordEndedStreak([8, 5, 3], 5)).toEqual([8, 5, 5, 3]);
    expect(recordEndedStreak([], 0)).toEqual([]);
    expect(recordEndedStreak([8, 5], 0)).toEqual([8, 5]);
  });
});
