import { Injectable, signal } from '@angular/core';
import { millisecondsToCentiseconds } from './time';

export type TimerState = 'READY' | 'RUNNING' | 'FINISHED';

@Injectable()
export class TimerEngine {
  private readonly currentState = signal<TimerState>('READY');
  private readonly elapsed = signal(0);
  private startedAt: number | null = null;

  readonly state = this.currentState.asReadonly();
  readonly elapsedCentiseconds = this.elapsed.asReadonly();

  start(): boolean {
    if (this.state() !== 'READY') return false;
    this.startedAt = performance.now();
    this.currentState.set('RUNNING');
    return true;
  }

  stop(): boolean {
    if (this.state() !== 'RUNNING' || this.startedAt === null) return false;
    const elapsedMilliseconds = performance.now() - this.startedAt;
    this.elapsed.set(millisecondsToCentiseconds(elapsedMilliseconds));
    this.startedAt = null;
    this.currentState.set('FINISHED');
    return true;
  }

  reset(): void {
    this.startedAt = null;
    this.elapsed.set(0);
    this.currentState.set('READY');
  }
}
