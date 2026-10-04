import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EntryShell } from '../../shared/components/entry-shell/entry-shell';
import { ProfileAvatar } from '../../shared/components/profile-avatar/profile-avatar';
import { AVATARS } from '../../shared/preferences/avatar-registry';
import { PreferencesStore } from '../../shared/preferences/preferences-store';

@Component({
  selector: 'app-online-entry-page',
  imports: [EntryShell, ProfileAvatar, RouterLink],
  templateUrl: './online-entry-page.html',
  styleUrl: './online-entry-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnlineEntryPage {
  protected readonly preferences = inject(PreferencesStore);
  protected readonly avatars = AVATARS;

  protected editNickname(event: Event): void {
    this.preferences.setNickname((event.target as HTMLInputElement).value);
  }
}
