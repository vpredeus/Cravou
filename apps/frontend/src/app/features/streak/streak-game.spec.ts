import { TestBed } from '@angular/core/testing';
import { TimerEngine } from '../../shared/timer/timer-engine';
import { StreakGame } from './streak-game';
import { ATTEMPT_TIMEOUT_CS, MAX_TARGET_CS, MIN_TARGET_CS } from './streak-rules';

describe('StreakGame', () => {
  let game: StreakGame;
  let now: number;

  const randomFor = (target: number) =>
    (target - MIN_TARGET_CS + 0.5) / (MAX_TARGET_CS - MIN_TARGET_CS + 1);

  beforeEach(() => {
    vi.useFakeTimers();
    now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    vi.spyOn(Math, 'random').mockReturnValue(randomFor(1233));
    TestBed.configureTestingModule({ providers: [TimerEngine, StreakGame] });
    game = TestBed.inject(StreakGame);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function attempt(elapsedMilliseconds: number): void {
    expect(game.start()).toBe(true);
    now += elapsedMilliseconds;
    game.stop();
    TestBed.tick();
  }

  it('starts a fresh in-memory session with a target, READY timer, zero streak and empty Top 5', () => {
    expect(game.targetCentiseconds()).toBe(1233);
    expect(game.timer.state()).toBe('READY');
    expect(game.timer.elapsedCentiseconds()).toBe(0);
    expect(game.currentStreak()).toBe(0);
    expect(game.bestStreaks()).toEqual([]);
    expect(game.result()).toBeNull();
  });

  it('does not retain ranking or streak in a new application session', () => {
    attempt(12337);
    game.nextAttempt();
    attempt(12340);
    expect(game.bestStreaks()).toEqual([1]);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [TimerEngine, StreakGame] });
    const newSession = TestBed.inject(StreakGame);
    expect(newSession.currentStreak()).toBe(0);
    expect(newSession.bestStreaks()).toEqual([]);
    expect(newSession.result()).toBeNull();
    expect(newSession.timer.state()).toBe('READY');
  });

  it.each([12330, 12337, 12339])('counts %s ms as an exact hit after truncation', (elapsed) => {
    attempt(elapsed);
    expect(game.result()?.status).toBe('CRAVOU');
    expect(game.currentStreak()).toBe(1);
    expect(game.bestStreaks()).toEqual([]);
  });

  it('grows an active streak and records it only when an error ends it', () => {
    for (let count = 1; count <= 3; count++) {
      attempt(12337);
      expect(game.currentStreak()).toBe(count);
      expect(game.bestStreaks()).toEqual([]);
      game.nextAttempt();
    }
    attempt(12340);
    expect(game.result()?.status).toBe('ERROU');
    expect(game.currentStreak()).toBe(0);
    expect(game.bestStreaks()).toEqual([3]);
    game.stop();
    TestBed.tick();
    expect(game.bestStreaks()).toEqual([3]);
  });

  it.each([120, 2540, 18970, 29999])(
    'accepts a poor STOP at %s ms as a normal error before the deadline',
    (elapsed) => {
      attempt(elapsed);
      expect(game.timer.state()).toBe('FINISHED');
      expect(game.result()?.status).toBe('ERROU');
      expect(game.bestStreaks()).toEqual([]);
    },
  );

  it('records 5, 8 and 3 only after each separate streak ends', () => {
    for (const length of [5, 8, 3]) {
      for (let hit = 0; hit < length; hit++) {
        attempt(12337);
        game.nextAttempt();
      }
      attempt(0);
      game.nextAttempt();
    }
    expect(game.bestStreaks()).toEqual([8, 5, 3]);
  });

  it('turns the absolute deadline into DNF, breaks the streak, and stores no numeric DNF result', () => {
    attempt(12337);
    game.nextAttempt();
    game.start();
    now += ATTEMPT_TIMEOUT_CS * 10;
    vi.advanceTimersByTime(ATTEMPT_TIMEOUT_CS * 10);
    TestBed.tick();
    expect(game.timer.state()).toBe('TIMED_OUT');
    expect(game.result()).toEqual({ status: 'DNF', targetCentiseconds: 1233 });
    expect(game.timer.elapsedCentiseconds()).toBe(0);
    expect(game.currentStreak()).toBe(0);
    expect(game.bestStreaks()).toEqual([1]);
    game.stop();
    TestBed.tick();
    expect(game.bestStreaks()).toEqual([1]);
  });

  it('does not let delayed callbacks turn a STOP after the deadline into a valid result', () => {
    attempt(30001);
    expect(game.result()?.status).toBe('DNF');
    expect(game.currentStreak()).toBe(0);
    expect(game.bestStreaks()).toEqual([]);
  });

  it('requires explicit nextAttempt and preserves a hit streak while resetting timer and target', () => {
    expect(game.nextAttempt()).toBe(false);
    game.start();
    expect(game.nextAttempt()).toBe(false);
    now = 12337;
    game.stop();
    expect(game.start()).toBe(false);
    vi.mocked(Math.random).mockReturnValue(randomFor(741));
    expect(game.nextAttempt()).toBe(true);
    expect(game.targetCentiseconds()).toBe(741);
    expect(game.timer.state()).toBe('READY');
    expect(game.timer.elapsedCentiseconds()).toBe(0);
    expect(game.result()).toBeNull();
    expect(game.currentStreak()).toBe(1);
  });

  it.each(['ERROU', 'DNF'])('preserves Top 5 and the reset streak after %s', (status) => {
    attempt(12337);
    game.nextAttempt();
    attempt(status === 'DNF' ? 30000 : 12340);
    expect(game.result()?.status).toBe(status);
    vi.mocked(Math.random).mockReturnValue(randomFor(2000));
    game.nextAttempt();
    expect(game.targetCentiseconds()).toBe(2000);
    expect(game.currentStreak()).toBe(0);
    expect(game.bestStreaks()).toEqual([1]);
    expect(game.timer.state()).toBe('READY');
    expect(game.result()).toBeNull();
  });
});
