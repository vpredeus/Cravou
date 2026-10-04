import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { TimerEngine } from '../../shared/timer/timer-engine';
import {
  ATTEMPT_TIMEOUT_CS,
  StreakResult,
  evaluateAttempt,
  generateTarget,
  recordEndedStreak,
} from './streak-rules';

@Injectable()
export class StreakGame {
  readonly timer = inject(TimerEngine);
  private readonly target = signal(generateTarget());
  private readonly streak = signal(0);
  private readonly best = signal<readonly number[]>([]);
  private readonly attemptResult = signal<StreakResult | null>(null);

  readonly targetCentiseconds = this.target.asReadonly();
  readonly currentStreak = this.streak.asReadonly();
  readonly bestStreaks = this.best.asReadonly();
  readonly result = this.attemptResult.asReadonly();
  readonly completed = computed(
    () => this.timer.state() === 'FINISHED' || this.timer.state() === 'TIMED_OUT',
  );

  constructor() {
    effect(() => {
      if (this.completed()) this.completeAttempt();
    });
  }

  start(): boolean {
    return this.timer.start(ATTEMPT_TIMEOUT_CS);
  }

  stop(): boolean {
    const stopped = this.timer.stop();
    this.completeAttempt();
    return stopped;
  }

  nextAttempt(): boolean {
    if (!this.completed()) return false;
    this.completeAttempt();
    this.target.set(generateTarget());
    this.attemptResult.set(null);
    this.timer.reset();
    return true;
  }

  private completeAttempt(): void {
    if (!this.completed() || this.result() !== null) return;
    const result: StreakResult =
      this.timer.state() === 'TIMED_OUT'
        ? { status: 'DNF', targetCentiseconds: this.targetCentiseconds() }
        : evaluateAttempt(this.targetCentiseconds(), this.timer.elapsedCentiseconds());
    this.attemptResult.set(result);
    if (result.status === 'CRAVOU') this.streak.update((streak) => streak + 1);
    else {
      this.best.update((best) => recordEndedStreak(best, this.currentStreak()));
      this.streak.set(0);
    }
  }
}
