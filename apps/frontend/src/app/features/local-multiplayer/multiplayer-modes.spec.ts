import {
  MULTIPLAYER_MODES,
  MultiplayerModeId,
  getMultiplayerMode,
  isModeAvailable,
} from './multiplayer-modes';

describe('Multiplayer mode metadata', () => {
  it('defines exactly the three stable IDs with unique identities', () => {
    const ids = MULTIPLAYER_MODES.map((mode) => mode.id);
    expect(ids).toEqual(['precision', 'hit', 'challenge']);
    expect(new Set(ids).size).toBe(MULTIPLAYER_MODES.length);
  });

  it.each(MULTIPLAYER_MODES)('provides valid metadata for $id', (mode) => {
    expect(mode.name.trim().length).toBeGreaterThan(0);
    expect(mode.description.trim().length).toBeGreaterThan(0);
    expect(Number.isSafeInteger(mode.minPlayers)).toBe(true);
    expect(Number.isSafeInteger(mode.maxPlayers)).toBe(true);
    expect(mode.minPlayers).toBeLessThanOrEqual(mode.maxPlayers);
    expect(getMultiplayerMode(mode.id)).toBe(mode);
  });

  it.each([
    [1, false],
    [2, true],
    [4, true],
    [8, true],
    [9, false],
    [2.5, false],
    [NaN, false],
  ])('checks availability for %s players', (count, expected) => {
    MULTIPLAYER_MODES.forEach((mode) => expect(isModeAvailable(mode, count)).toBe(expected));
  });

  it('uses metadata bounds inclusively instead of assuming the local group limits', () => {
    const mode = { ...MULTIPLAYER_MODES[0], minPlayers: 3, maxPlayers: 5 };
    expect(isModeAvailable(mode, 2)).toBe(false);
    expect(isModeAvailable(mode, 3)).toBe(true);
    expect(isModeAvailable(mode, 5)).toBe(true);
    expect(isModeAvailable(mode, 6)).toBe(false);
  });

  it('does not resolve missing or unknown IDs', () => {
    expect(getMultiplayerMode(null)).toBeUndefined();
    expect(getMultiplayerMode('unknown' as MultiplayerModeId)).toBeUndefined();
  });
});
