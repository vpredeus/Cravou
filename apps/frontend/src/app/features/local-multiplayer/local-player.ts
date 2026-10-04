import { AvatarId } from '../../shared/preferences/avatar-registry';

export const MIN_LOCAL_PLAYERS = 2;
export const MAX_LOCAL_PLAYERS = 8;
export const INITIAL_LOCAL_PLAYERS = 4;
// Matches the input maxlength: enough for personal names without overwhelming a card.
export const MAX_LOCAL_PLAYER_NAME_LENGTH = 32;

export interface LocalPlayer {
  readonly id: string;
  readonly name: string;
  readonly avatarId: AvatarId;
}

export function isLocalPlayerNameValid(name: string): boolean {
  return name.trim().length > 0 && name.length <= MAX_LOCAL_PLAYER_NAME_LENGTH;
}
