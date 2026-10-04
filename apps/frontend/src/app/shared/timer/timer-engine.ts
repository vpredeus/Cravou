import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { millisecondsToCentiseconds } from './time';

export type TimerState = 'READY' | 'RUNNING' | 'FINISHED' | 'TIMED_OUT';

@Injectable()
export class TimerEngine {
  private readonly currentState = signal<TimerState>('READY');
  private readonly elapsed = signal(0);
  private startedAt: number | null = null;
  private timeoutMilliseconds: number | null = null;
  private timeoutHandle?: ReturnType<typeof setTimeout>;

  readonly state = this.currentState.asReadonly();
  readonly elapsedCentiseconds = this.elapsed.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.cancelTimeout());
  }

  start(timeoutCentiseconds?: number): boolean {
    if (this.state() !== 'READY') return false;
    if (
      timeoutCentiseconds !== undefined &&
      (!Number.isSafeInteger(timeoutCentiseconds) || timeoutCentiseconds <= 0)
    ) {
      throw new RangeError('Timeout must be a positive integer in centiseconds.');
    }
    this.timeoutMilliseconds = timeoutCentiseconds === undefined ? null : timeoutCentiseconds * 10;
    this.startedAt = performance.now();
    this.currentState.set('RUNNING');
    if (this.timeoutMilliseconds !== null) this.scheduleTimeout(this.timeoutMilliseconds);
    return true;
  }

  stop(): boolean {
    if (this.state() !== 'RUNNING' || this.startedAt === null) return false;
    const elapsedMilliseconds = performance.now() - this.startedAt;
    // STOP must also check the deadline in case a background tab delayed the callback.
    if (this.timeoutMilliseconds !== null && elapsedMilliseconds >= this.timeoutMilliseconds) {
      this.finishTimedOut();
      return false;
    }
    this.cancelTimeout();
    this.elapsed.set(millisecondsToCentiseconds(elapsedMilliseconds));
    this.startedAt = null;
    this.currentState.set('FINISHED');
    return true;
  }

  reset(): void {
    this.cancelTimeout();
    this.startedAt = null;
    this.elapsed.set(0);
    this.currentState.set('READY');
  }

  private scheduleTimeout(delayMilliseconds: number): void {
    this.timeoutHandle = setTimeout(() => {
      if (
        this.state() !== 'RUNNING' ||
        this.startedAt === null ||
        this.timeoutMilliseconds === null
      )
        return;
      const remaining = this.timeoutMilliseconds - (performance.now() - this.startedAt);
      if (remaining <= 0) this.finishTimedOut();
      else this.scheduleTimeout(remaining);
    }, delayMilliseconds);
  }

  private finishTimedOut(): void {
    this.cancelTimeout();
    this.startedAt = null;
    this.currentState.set('TIMED_OUT');
  }

  private cancelTimeout(): void {
    clearTimeout(this.timeoutHandle);
    this.timeoutHandle = undefined;
  }
}
