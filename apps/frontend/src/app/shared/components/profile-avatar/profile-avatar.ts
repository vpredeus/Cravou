import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AVATARS, AvatarId } from '../../preferences/avatar-registry';

@Component({
  selector: 'app-profile-avatar',
  template:
    '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path [attr.d]="avatar().path" /></svg>',
  styles: `
    :host {
      display: block;
      aspect-ratio: 1;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.7;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
})
export class ProfileAvatar {
  readonly avatarId = input<AvatarId>(AVATARS[0].id);
  protected readonly avatar = computed(
    () => AVATARS.find((avatar) => avatar.id === this.avatarId()) ?? AVATARS[0],
  );
}
