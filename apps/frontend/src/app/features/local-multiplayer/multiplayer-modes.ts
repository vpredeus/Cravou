import { MAX_LOCAL_PLAYERS, MIN_LOCAL_PLAYERS } from './local-player';

export type MultiplayerModeId = 'precision' | 'hit' | 'challenge';

export interface MultiplayerModeDefinition {
  readonly id: MultiplayerModeId;
  readonly name: string;
  readonly description: string;
  readonly minPlayers: number;
  readonly maxPlayers: number;
}

export const MULTIPLAYER_MODES = [
  {
    id: 'precision',
    name: 'Precisão',
    description: 'Chegue o mais próximo possível da meta.',
    minPlayers: MIN_LOCAL_PLAYERS,
    maxPlayers: MAX_LOCAL_PLAYERS,
  },
  {
    id: 'hit',
    name: 'Cravada',
    description: 'Crave a meta para continuar no jogo.',
    minPlayers: MIN_LOCAL_PLAYERS,
    maxPlayers: MAX_LOCAL_PLAYERS,
  },
  {
    id: 'challenge',
    name: 'Duvidar',
    description: 'Continue contando ou duvide do jogador anterior.',
    minPlayers: MIN_LOCAL_PLAYERS,
    maxPlayers: MAX_LOCAL_PLAYERS,
  },
] as const satisfies readonly MultiplayerModeDefinition[];

export function getMultiplayerMode(
  modeId: MultiplayerModeId | null,
): MultiplayerModeDefinition | undefined {
  return MULTIPLAYER_MODES.find((mode) => mode.id === modeId);
}

export function isModeAvailable(mode: MultiplayerModeDefinition, playerCount: number): boolean {
  return (
    Number.isSafeInteger(playerCount) &&
    playerCount >= mode.minPlayers &&
    playerCount <= mode.maxPlayers
  );
}
