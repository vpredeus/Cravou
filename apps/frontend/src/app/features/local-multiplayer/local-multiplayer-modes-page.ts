import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { EntryShell } from '../../shared/components/entry-shell/entry-shell';
import { LocalMultiplayerSessionStore } from './local-multiplayer-session-store';
import { MULTIPLAYER_MODES, isModeAvailable } from './multiplayer-modes';

@Component({
  selector: 'app-local-multiplayer-modes-page',
  imports: [EntryShell],
  templateUrl: './local-multiplayer-modes-page.html',
  styleUrl: './local-multiplayer-modes-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocalMultiplayerModesPage {
  protected readonly session = inject(LocalMultiplayerSessionStore);
  protected readonly choices = computed(() =>
    MULTIPLAYER_MODES.map((mode) => ({
      mode,
      available: isModeAvailable(mode, this.session.playerCount()),
    })),
  );
  protected readonly canContinue = computed(
    () => this.session.isValid() && this.session.hasValidMode(),
  );
  private readonly router = inject(Router);

  protected continue(): void {
    if (this.canContinue()) void this.router.navigateByUrl('/local/multiplayer/match');
  }
}
