import { TestBed } from '@angular/core/testing';
import { TimerEngine } from './timer-engine';
import { formatCentiseconds } from './time';

describe('TimerEngine', () => {
  let timer: TimerEngine;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [TimerEngine] });
    timer = TestBed.inject(TimerEngine);
  });
  afterEach(() => vi.restoreAllMocks());

  it('starts READY with a zero display, then transitions to RUNNING', () => {
    const clock = vi.spyOn(performance, 'now').mockReturnValue(0);
    expect(timer.state()).toBe('READY');
    expect(formatCentiseconds(timer.elapsedCentiseconds())).toBe('00.00');
    expect(timer.start()).toBe(true);
    expect(timer.state()).toBe('RUNNING');
    expect(clock).toHaveBeenCalledOnce();
  });

  it.each([
    [12337, 1233],
    [12339, 1233],
    [12340, 1234],
  ])(
    'uses the monotonic timestamp difference to finish %s ms as %s centiseconds',
    (elapsed, expected) => {
      vi.spyOn(performance, 'now')
        .mockReturnValueOnce(150.5)
        .mockReturnValueOnce(150.5 + elapsed);
      timer.start();
      expect(timer.stop()).toBe(true);
      expect(timer.state()).toBe('FINISHED');
      expect(timer.elapsedCentiseconds()).toBe(expected);
    },
  );

  it('ignores invalid transitions without changing timestamps or the saved result', () => {
    const clock = vi.spyOn(performance, 'now').mockReturnValueOnce(0).mockReturnValueOnce(12337);
    expect(timer.stop()).toBe(false);
    timer.start();
    expect(timer.start()).toBe(false);
    timer.stop();
    expect(timer.start()).toBe(false);
    expect(timer.stop()).toBe(false);
    expect(timer.state()).toBe('FINISHED');
    expect(timer.elapsedCentiseconds()).toBe(1233);
    expect(clock).toHaveBeenCalledTimes(2);
  });

  it('explicitly resets a finished result to READY and zero', () => {
    vi.spyOn(performance, 'now').mockReturnValueOnce(40).mockReturnValueOnce(13379);
    timer.start();
    timer.stop();
    timer.reset();
    expect(timer.state()).toBe('READY');
    expect(timer.elapsedCentiseconds()).toBe(0);
    expect(formatCentiseconds(timer.elapsedCentiseconds())).toBe('00.00');
  });

  it('can reset a running attempt and measure a new attempt independently', () => {
    vi.spyOn(performance, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(500)
      .mockReturnValueOnce(1737);
    timer.start();
    timer.reset();
    expect(timer.stop()).toBe(false);
    timer.start();
    timer.stop();
    expect(timer.elapsedCentiseconds()).toBe(123);
  });
});

describe('TimerEngine optional deadline', () => {
  let timer: TimerEngine;
  let now: number;

  beforeEach(() => {
    vi.useFakeTimers();
    now = 100;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    TestBed.configureTestingModule({ providers: [TimerEngine] });
    timer = TestBed.inject(TimerEngine);
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('stays RUNNING before 30 seconds and times out exactly at the deadline', () => {
    timer.start(3000);
    now += 29999;
    vi.advanceTimersByTime(29999);
    expect(timer.state()).toBe('RUNNING');
    now += 1;
    vi.advanceTimersByTime(1);
    expect(timer.state()).toBe('TIMED_OUT');
    expect(timer.elapsedCentiseconds()).toBe(0);
    expect(timer.stop()).toBe(false);
    expect(timer.start()).toBe(false);
  });

  it('checks performance.now again and reschedules if a callback arrives early', () => {
    timer.start(3000);
    now += 29990;
    vi.advanceTimersByTime(30000);
    expect(timer.state()).toBe('RUNNING');
    now += 10;
    vi.advanceTimersByTime(10);
    expect(timer.state()).toBe('TIMED_OUT');
  });

  it('uses measured time even if a callback arrives late', () => {
    timer.start(3000);
    now += 45000;
    vi.advanceTimersByTime(30000);
    expect(timer.state()).toBe('TIMED_OUT');
    expect(timer.elapsedCentiseconds()).toBe(0);
  });

  it.each([30000, 30001])(
    'rejects STOP at %s ms even before the scheduled callback runs',
    (elapsed) => {
      timer.start(3000);
      now += elapsed;
      expect(timer.stop()).toBe(false);
      expect(timer.state()).toBe('TIMED_OUT');
      expect(timer.elapsedCentiseconds()).toBe(0);
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it('keeps an ordinary STOP before the deadline valid and cancels its pending timeout', () => {
    timer.start(3000);
    now += 29999;
    expect(timer.stop()).toBe(true);
    expect(timer.state()).toBe('FINISHED');
    expect(timer.elapsedCentiseconds()).toBe(2999);
    expect(vi.getTimerCount()).toBe(0);
    now += 30000;
    vi.advanceTimersByTime(30000);
    expect(timer.state()).toBe('FINISHED');
  });

  it('supports a different timeout and resets TIMED_OUT to READY', () => {
    timer.start(100);
    now += 1000;
    vi.advanceTimersByTime(1000);
    expect(timer.state()).toBe('TIMED_OUT');
    timer.reset();
    expect(timer.state()).toBe('READY');
    expect(timer.elapsedCentiseconds()).toBe(0);
    timer.start(3000);
    expect(timer.state()).toBe('RUNNING');
  });

  it('cancels running deadlines on reset and injector destruction', () => {
    timer.start(3000);
    timer.reset();
    expect(vi.getTimerCount()).toBe(0);
    now += 30000;
    vi.advanceTimersByTime(30000);
    expect(timer.state()).toBe('READY');
    timer.start(3000);
    TestBed.resetTestingModule();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not add a deadline to modes that omit one', () => {
    timer.start();
    now += 60000;
    vi.advanceTimersByTime(60000);
    expect(timer.state()).toBe('RUNNING');
    timer.stop();
    expect(timer.elapsedCentiseconds()).toBe(6000);
  });

  it.each([0, -1, 12.33, NaN, Infinity])('rejects invalid timeout %s', (timeout) => {
    expect(() => timer.start(timeout)).toThrow(RangeError);
    expect(timer.state()).toBe('READY');
  });
});
