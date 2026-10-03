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
