import { formatCentiseconds } from '../../shared/timer/time';

export const MIN_TARGET_CS = 10;
export const MAX_TARGET_CS = 2000;
export const ATTEMPT_TIMEOUT_CS = 3000;
export const BEST_STREAKS_LIMIT = 5;

export type StreakResult =
  | {
      readonly status: 'CRAVOU' | 'ERROU';
      readonly targetCentiseconds: number;
      readonly elapsedCentiseconds: number;
      readonly differenceCentiseconds: number;
    }
  | { readonly status: 'DNF'; readonly targetCentiseconds: number };

export function generateTarget(random: () => number = Math.random): number {
  return MIN_TARGET_CS + Math.floor(random() * (MAX_TARGET_CS - MIN_TARGET_CS + 1));
}

export function evaluateAttempt(
  targetCentiseconds: number,
  elapsedCentiseconds: number,
): StreakResult {
  return {
    status: elapsedCentiseconds === targetCentiseconds ? 'CRAVOU' : 'ERROU',
    targetCentiseconds,
    elapsedCentiseconds,
    differenceCentiseconds: elapsedCentiseconds - targetCentiseconds,
  };
}

export function formatSecondsLabel(centiseconds: number): string {
  return formatCentiseconds(centiseconds)
    .replace(/^0(?=\d)/, '')
    .replace('.', ',');
}

export function formatDifference(differenceCentiseconds: number): string {
  const sign = differenceCentiseconds > 0 ? '+' : differenceCentiseconds < 0 ? '-' : '';
  return `${sign}${formatSecondsLabel(Math.abs(differenceCentiseconds))} s`;
}

export function recordEndedStreak(
  bestStreaks: readonly number[],
  endedStreak: number,
): readonly number[] {
  if (endedStreak === 0) return bestStreaks;
  return [...bestStreaks, endedStreak].sort((a, b) => b - a).slice(0, BEST_STREAKS_LIMIT);
}
