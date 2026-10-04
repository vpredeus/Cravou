import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ProfileAvatar } from '../../shared/components/profile-avatar/profile-avatar';
import { AVATARS, AvatarId } from '../../shared/preferences/avatar-registry';
import { LocalPlayer, MAX_LOCAL_PLAYER_NAME_LENGTH, isLocalPlayerNameValid } from './local-player';

@Component({
  selector: 'app-player-editor',
  imports: [ProfileAvatar],
  templateUrl: './player-editor.html',
  styleUrl: './player-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerEditor {
  readonly player = input.required<LocalPlayer>();
  readonly position = input.required<number>();
  readonly nameChange = output<string>();
  readonly avatarChange = output<AvatarId>();
  protected readonly avatars = AVATARS;
  protected readonly nameLimit = MAX_LOCAL_PLAYER_NAME_LENGTH;
  protected readonly invalidName = computed(() => !isLocalPlayerNameValid(this.player().name));
}
