import { TestBed } from '@angular/core/testing';
import { AVATARS, AvatarId } from '../../shared/preferences/avatar-registry';
import { LocalMultiplayerSessionStore } from './local-multiplayer-session-store';
import {
  INITIAL_LOCAL_PLAYERS,
  MAX_LOCAL_PLAYER_NAME_LENGTH,
  MAX_LOCAL_PLAYERS,
  MIN_LOCAL_PLAYERS,
} from './local-player';

describe('LocalMultiplayerSessionStore', () => {
  let store: LocalMultiplayerSessionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(LocalMultiplayerSessionStore);
  });

  it('does not silently create a valid group before initialization', () => {
    expect(store.players()).toEqual([]);
    expect(store.isValid()).toBe(false);
    expect(store.prepareToContinue()).toBe(false);
  });

  it('initializes four players with unique IDs, names and predictable registry avatars', () => {
    store.initialize();
    expect(store.playerCount()).toBe(INITIAL_LOCAL_PLAYERS);
    expect(new Set(store.players().map((player) => player.id)).size).toBe(INITIAL_LOCAL_PLAYERS);
    store.players().forEach((player, index) => {
      expect(player.id.trim().length).toBeGreaterThan(0);
      expect(player.name).toBe(`Jogador ${index + 1}`);
      expect(player.avatarId).toBe(AVATARS[index % AVATARS.length].id);
    });
    expect(store.isValid()).toBe(true);
  });

  it('initializes only once and preserves even an unfinished invalid edit', () => {
    store.initialize();
    store.updatePlayerName(store.players()[0].id, '');
    const players = store.players();
    store.initialize();
    expect(store.players()).toBe(players);
    expect(store.isValid()).toBe(false);
  });

  it('protects both bounds when count is set directly', () => {
    store.setPlayerCount(-100);
    expect(store.playerCount()).toBe(MIN_LOCAL_PLAYERS);
    store.setPlayerCount(100);
    expect(store.playerCount()).toBe(MAX_LOCAL_PLAYERS);
    expect(store.isValid()).toBe(true);
  });

  it.each([NaN, Infinity, -Infinity, 3.5])('ignores invalid count %s', (count) => {
    store.initialize();
    const players = store.players();
    store.setPlayerCount(count);
    expect(store.players()).toBe(players);
  });

  it('does not remove at minimum or add at maximum', () => {
    store.setPlayerCount(MIN_LOCAL_PLAYERS);
    const minimumPlayers = store.players();
    store.decrease();
    expect(store.players()).toBe(minimumPlayers);
    expect(store.canDecrease()).toBe(false);
    store.setPlayerCount(MAX_LOCAL_PLAYERS);
    const maximumPlayers = store.players();
    store.increase();
    expect(store.players()).toBe(maximumPlayers);
    expect(store.canIncrease()).toBe(false);
  });

  it('adds only a new player and preserves every existing customized player', () => {
    store.initialize();
    store.updatePlayerName(store.players()[0].id, 'João');
    store.updatePlayerAvatar(store.players()[0].id, 'wave');
    const existing = store.players();
    store.increase();
    expect(store.playerCount()).toBe(INITIAL_LOCAL_PLAYERS + 1);
    existing.forEach((player, index) => expect(store.players()[index]).toBe(player));
    const added = store.players().at(-1)!;
    expect(existing.some((player) => player.id === added.id)).toBe(false);
    expect(added.name).toBe('Jogador 5');
    expect(added.avatarId).toBe(AVATARS[INITIAL_LOCAL_PLAYERS % AVATARS.length].id);
  });

  it('removes only the last player and gives a fresh ID when that position is added again', () => {
    store.initialize();
    store.increase();
    store.updatePlayerName(store.players()[0].id, 'Ana');
    const existing = store.players();
    const removed = existing.at(-1)!;
    store.decrease();
    expect(store.players()).toEqual(existing.slice(0, -1));
    store.players().forEach((player, index) => expect(player).toBe(existing[index]));
    store.increase();
    expect(store.players().at(-1)!.id).not.toBe(removed.id);
  });

  it('edits a name by ID without modifying other players, trimming input or changing identity', () => {
    store.initialize();
    const existing = store.players();
    store.updatePlayerName(existing[1].id, '  Maria Clara  ');
    expect(store.players()[1]).toEqual({ ...existing[1], name: '  Maria Clara  ' });
    expect(store.players()[0]).toBe(existing[0]);
    expect(store.players()[2]).toBe(existing[2]);
    expect(existing[1].name).toBe('Jogador 2');
  });

  it('edits an avatar by ID without modifying other players or changing identity', () => {
    store.initialize();
    const existing = store.players();
    store.updatePlayerAvatar(existing[1].id, 'wave');
    expect(store.players()[1]).toEqual({ ...existing[1], avatarId: 'wave' });
    expect(store.players()[0]).toBe(existing[0]);
    expect(store.players()[2]).toBe(existing[2]);
  });

  it('ignores unknown IDs and invalid avatar values', () => {
    store.initialize();
    const existing = store.players();
    store.updatePlayerName('unknown', 'João');
    store.updatePlayerAvatar('unknown', 'wave');
    store.updatePlayerAvatar(existing[0].id, 'unknown' as AvatarId);
    expect(store.players()).toEqual(existing);
    expect(store.isValid()).toBe(true);
  });

  it.each(['', '   ', '\t\n'])('rejects effectively empty name %j', (name) => {
    store.initialize();
    store.updatePlayerName(store.players()[0].id, name);
    expect(store.isValid()).toBe(false);
    expect(store.prepareToContinue()).toBe(false);
  });

  it('allows duplicate names and avatars', () => {
    store.initialize();
    store.players().forEach((player) => {
      store.updatePlayerName(player.id, 'João');
      store.updatePlayerAvatar(player.id, 'wave');
    });
    expect(store.isValid()).toBe(true);
  });

  it('caps name length independently of the input', () => {
    store.initialize();
    store.updatePlayerName(store.players()[0].id, 'a'.repeat(MAX_LOCAL_PLAYER_NAME_LENGTH + 10));
    expect(store.players()[0].name.length).toBe(MAX_LOCAL_PLAYER_NAME_LENGTH);
  });

  it('normalizes only external spaces before continuing, preserving IDs and internal spaces', () => {
    store.initialize();
    const id = store.players()[0].id;
    store.updatePlayerName(id, '  João  Pedro  ');
    const avatarId = store.players()[0].avatarId;
    expect(store.prepareToContinue()).toBe(true);
    expect(store.players()[0]).toEqual({ id, avatarId, name: 'João  Pedro' });
  });

  it('explicitly resets to four fresh default players', () => {
    store.initialize();
    store.setPlayerCount(MAX_LOCAL_PLAYERS);
    store.updatePlayerName(store.players()[0].id, 'Ana');
    store.updatePlayerAvatar(store.players()[0].id, 'wave');
    const oldIds = new Set(store.players().map((player) => player.id));
    store.reset();
    expect(store.playerCount()).toBe(INITIAL_LOCAL_PLAYERS);
    expect(store.players()[0].name).toBe('Jogador 1');
    expect(store.players()[0].avatarId).toBe(AVATARS[0].id);
    expect(store.players().every((player) => !oldIds.has(player.id))).toBe(true);
    expect(store.isValid()).toBe(true);
  });
});
