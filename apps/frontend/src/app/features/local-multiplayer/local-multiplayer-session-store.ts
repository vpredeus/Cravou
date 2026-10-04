import { Injectable, computed, signal } from '@angular/core';
import { AVATARS, AvatarId } from '../../shared/preferences/avatar-registry';
import {
  INITIAL_LOCAL_PLAYERS,
  LocalPlayer,
  MAX_LOCAL_PLAYERS,
  MAX_LOCAL_PLAYER_NAME_LENGTH,
  MIN_LOCAL_PLAYERS,
  isLocalPlayerNameValid,
} from './local-player';
import { MultiplayerModeId, getMultiplayerMode, isModeAvailable } from './multiplayer-modes';

@Injectable({ providedIn: 'root' })
export class LocalMultiplayerSessionStore {
  // Empty until setup is visited; direct access to the next step must not create a group.
  private readonly currentPlayers = signal<readonly LocalPlayer[]>([]);
  private readonly currentMode = signal<MultiplayerModeId | null>(null);
  readonly players = this.currentPlayers.asReadonly();
  readonly selectedMode = this.currentMode.asReadonly();
  readonly selectedModeDefinition = computed(() => getMultiplayerMode(this.selectedMode()));
  readonly hasValidMode = computed(() => {
    const mode = this.selectedModeDefinition();
    return mode !== undefined && isModeAvailable(mode, this.playerCount());
  });
  readonly playerCount = computed(() => this.players().length);
  readonly canDecrease = computed(() => this.playerCount() > MIN_LOCAL_PLAYERS);
  readonly canIncrease = computed(() => this.playerCount() < MAX_LOCAL_PLAYERS);
  readonly isValid = computed(() => {
    const players = this.players();
    return (
      players.length >= MIN_LOCAL_PLAYERS &&
      players.length <= MAX_LOCAL_PLAYERS &&
      new Set(players.map((player) => player.id)).size === players.length &&
      players.every(
        (player) =>
          player.id.trim().length > 0 &&
          isLocalPlayerNameValid(player.name) &&
          AVATARS.some((avatar) => avatar.id === player.avatarId),
      )
    );
  });

  initialize(): void {
    if (this.playerCount() === 0) this.reset();
  }

  reset(): void {
    this.clearMode();
    this.currentPlayers.set(
      Array.from({ length: INITIAL_LOCAL_PLAYERS }, (_, position) => this.createPlayer(position)),
    );
  }

  increase(): void {
    this.setPlayerCount(this.playerCount() + 1);
  }

  decrease(): void {
    this.setPlayerCount(this.playerCount() - 1);
  }

  setPlayerCount(requestedCount: number): void {
    if (!Number.isSafeInteger(requestedCount)) return;
    const count = Math.min(MAX_LOCAL_PLAYERS, Math.max(MIN_LOCAL_PLAYERS, requestedCount));
    this.currentPlayers.update((players) => {
      if (count === players.length) return players;
      if (count < players.length) return players.slice(0, count);
      return [
        ...players,
        ...Array.from({ length: count - players.length }, (_, offset) =>
          this.createPlayer(players.length + offset),
        ),
      ];
    });
    const mode = this.selectedModeDefinition();
    if (mode && !isModeAvailable(mode, this.playerCount())) this.clearMode();
  }

  selectMode(modeId: MultiplayerModeId): boolean {
    const mode = getMultiplayerMode(modeId);
    if (!mode || !isModeAvailable(mode, this.playerCount())) return false;
    this.currentMode.set(mode.id);
    return true;
  }

  clearMode(): void {
    this.currentMode.set(null);
  }

  updatePlayerName(playerId: string, name: string): void {
    this.currentPlayers.update((players) =>
      players.map((player) =>
        player.id === playerId
          ? { ...player, name: name.slice(0, MAX_LOCAL_PLAYER_NAME_LENGTH) }
          : player,
      ),
    );
  }

  updatePlayerAvatar(playerId: string, avatarId: AvatarId): void {
    if (!AVATARS.some((avatar) => avatar.id === avatarId)) return;
    this.currentPlayers.update((players) =>
      players.map((player) => (player.id === playerId ? { ...player, avatarId } : player)),
    );
  }

  prepareToContinue(): boolean {
    if (!this.isValid()) return false;
    this.currentPlayers.update((players) =>
      players.map((player) => ({ ...player, name: player.name.trim() })),
    );
    return true;
  }

  private createPlayer(position: number): LocalPlayer {
    return {
      id: crypto.randomUUID(),
      name: `Jogador ${position + 1}`,
      avatarId: AVATARS[position % AVATARS.length].id,
    };
  }
}
