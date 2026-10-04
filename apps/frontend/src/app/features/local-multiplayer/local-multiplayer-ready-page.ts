import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { EntryShell } from '../../shared/components/entry-shell/entry-shell';
import { ProfileAvatar } from '../../shared/components/profile-avatar/profile-avatar';
import { LocalMultiplayerSessionStore } from './local-multiplayer-session-store';

@Component({
  selector: 'app-local-multiplayer-ready-page',
  imports: [EntryShell, ProfileAvatar],
  templateUrl: './local-multiplayer-ready-page.html',
  styleUrl: './local-multiplayer-ready-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocalMultiplayerReadyPage {
  protected readonly session = inject(LocalMultiplayerSessionStore);
}
