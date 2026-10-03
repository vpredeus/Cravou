export function millisecondsToCentiseconds(milliseconds: number): number {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    throw new RangeError('Elapsed milliseconds must be finite and non-negative.');
  }
  return Math.floor(milliseconds / 10);
}

export function formatCentiseconds(centiseconds: number): string {
  if (!Number.isSafeInteger(centiseconds) || centiseconds < 0) {
    throw new RangeError('Centiseconds must be a non-negative safe integer.');
  }
  const seconds = Math.floor(centiseconds / 100);
  const fraction = centiseconds % 100;
  return `${String(seconds).padStart(2, '0')}.${String(fraction).padStart(2, '0')}`;
}
