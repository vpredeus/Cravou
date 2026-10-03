import { Injectable, signal } from '@angular/core';
import { AVATARS, AvatarId } from './avatar-registry';

interface SessionProfile {
  readonly nickname: string;
  readonly avatarId: AvatarId;
}

@Injectable({ providedIn: 'root' })
export class PreferencesStore {
  private readonly currentProfile = signal<SessionProfile>({
    nickname: 'Jogador',
    avatarId: AVATARS[0].id,
  });
  private readonly displayColor = signal<string | null>(null);
  private readonly gameBackground = signal<string | null>(null);
  private readonly audioEnabled = signal(true);

  readonly profile = this.currentProfile.asReadonly();
  readonly accentColor = this.displayColor.asReadonly();
  readonly backgroundColor = this.gameBackground.asReadonly();
  readonly soundEnabled = this.audioEnabled.asReadonly();

  setNickname(nickname: string): void {
    this.currentProfile.update((profile) => ({ ...profile, nickname }));
  }

  setAvatar(avatarId: AvatarId): void {
    this.currentProfile.update((profile) => ({ ...profile, avatarId }));
  }

  setAccentColor(color: string): void {
    this.displayColor.set(color);
  }

  setBackgroundColor(color: string): void {
    this.gameBackground.set(color);
  }

  setSoundEnabled(enabled: boolean): void {
    this.audioEnabled.set(enabled);
  }

  initializeAppearance(accent: string, background: string): void {
    // Read existing CSS defaults once, preserving manual themes and current session choices.
    if (this.accentColor() === null && accent) this.displayColor.set(accent);
    if (this.backgroundColor() === null && background) this.gameBackground.set(background);
  }
}
