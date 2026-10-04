import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { EntryShell } from '../../shared/components/entry-shell/entry-shell';
import { LocalMultiplayerSessionStore } from './local-multiplayer-session-store';
import { PlayerEditor } from './player-editor';

@Component({
  selector: 'app-local-multiplayer-page',
  imports: [EntryShell, PlayerEditor],
  templateUrl: './local-multiplayer-page.html',
  styleUrl: './local-multiplayer-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocalMultiplayerPage {
  protected readonly session = inject(LocalMultiplayerSessionStore);
  private readonly router = inject(Router);

  constructor() {
    this.session.initialize();
  }

  protected continue(): void {
    if (this.session.prepareToContinue()) {
      void this.router.navigateByUrl('/local/multiplayer/modes');
    }
  }
}
