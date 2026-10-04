import { TestBed } from '@angular/core/testing';
import { LocalMultiplayerSessionStore } from './local-multiplayer-session-store';
import * as catalog from './multiplayer-modes';

describe('Local multiplayer mode selection state', () => {
  let session: LocalMultiplayerSessionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    session = TestBed.inject(LocalMultiplayerSessionStore);
  });

  it('starts without a mode and keeps player validity independent of mode selection', () => {
    expect(session.selectedMode()).toBeNull();
    expect(session.hasValidMode()).toBe(false);
    session.initialize();
    expect(session.selectedMode()).toBeNull();
    expect(session.isValid()).toBe(true);
    expect(session.hasValidMode()).toBe(false);
  });

  it.each(catalog.MULTIPLAYER_MODES)('selects $id without touching any players', (mode) => {
    session.initialize();
    session.updatePlayerName(session.players()[0].id, 'Ana');
    session.updatePlayerAvatar(session.players()[0].id, 'wave');
    const players = session.players();
    expect(session.selectMode(mode.id)).toBe(true);
    expect(session.selectedMode()).toBe(mode.id);
    expect(session.selectedModeDefinition()?.id).toBe(mode.id);
    expect(session.hasValidMode()).toBe(true);
    expect(session.players()).toBe(players);
  });

  it('replaces the previous selection and can explicitly clear it', () => {
    session.initialize();
    const players = session.players();
    session.selectMode('precision');
    session.selectMode('hit');
    expect(session.selectedMode()).toBe('hit');
    session.selectMode('challenge');
    expect(session.selectedMode()).toBe('challenge');
    session.clearMode();
    expect(session.selectedMode()).toBeNull();
    expect(session.hasValidMode()).toBe(false);
    expect(session.players()).toBe(players);
  });

  it('rejects unknown IDs without corrupting the existing selection', () => {
    session.initialize();
    session.selectMode('precision');
    const players = session.players();
    expect(session.selectMode('unknown' as catalog.MultiplayerModeId)).toBe(false);
    expect(session.selectedMode()).toBe('precision');
    expect(session.players()).toBe(players);
  });

  it('rejects a mode when no group exists', () => {
    expect(session.selectMode('precision')).toBe(false);
    expect(session.selectedMode()).toBeNull();
    expect(session.players()).toEqual([]);
  });

  it('preserves selection across compatible size changes, profile edits and initialization', () => {
    session.initialize();
    session.selectMode('challenge');
    session.updatePlayerName(session.players()[0].id, '  João  ');
    session.updatePlayerAvatar(session.players()[0].id, 'wave');
    session.setPlayerCount(2);
    expect(session.selectedMode()).toBe('challenge');
    session.setPlayerCount(8);
    session.prepareToContinue();
    session.initialize();
    expect(session.selectedMode()).toBe('challenge');
    expect(session.hasValidMode()).toBe(true);
    expect(session.players()[0].name).toBe('João');
  });

  it('rejects and clears an incompatible mode using its metadata', () => {
    // Exercise a narrower future catalog entry without changing production mode limits.
    const mode = catalog.MULTIPLAYER_MODES[0];
    const originalMetadata = Object.getOwnPropertyDescriptors(mode);
    Object.defineProperties(mode, { minPlayers: { value: 3 }, maxPlayers: { value: 5 } });
    try {
      session.setPlayerCount(2);
      expect(session.selectMode('precision')).toBe(false);
      session.setPlayerCount(4);
      expect(session.selectMode('precision')).toBe(true);
      session.setPlayerCount(5);
      expect(session.selectedMode()).toBe('precision');
      session.setPlayerCount(6);
      expect(session.selectedMode()).toBeNull();
      expect(session.hasValidMode()).toBe(false);
      expect(session.playerCount()).toBe(6);
    } finally {
      Object.defineProperties(mode, originalMetadata);
    }
  });

  it('clears selection only on explicit reset of the session', () => {
    session.initialize();
    session.selectMode('hit');
    session.reset();
    expect(session.selectedMode()).toBeNull();
    expect(session.hasValidMode()).toBe(false);
    expect(session.isValid()).toBe(true);
  });
});
