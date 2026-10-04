import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { GameDevice } from '../../shared/components/game-device/game-device';
import { SettingsPanel } from '../../shared/components/settings-panel/settings-panel';
import { PreferencesStore } from '../../shared/preferences/preferences-store';
import { formatCentiseconds } from '../../shared/timer/time';
import { TimerEngine } from '../../shared/timer/timer-engine';
import { StreakGame } from './streak-game';
import { formatDifference, formatSecondsLabel } from './streak-rules';

@Component({
  selector: 'app-streak-page',
  imports: [GameDevice, SettingsPanel],
  providers: [TimerEngine, StreakGame],
  templateUrl: './streak-page.html',
  styleUrl: './streak-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StreakPage {
  protected readonly game = inject(StreakGame);
  protected readonly preferences = inject(PreferencesStore);
  protected readonly settingsOpen = signal(false);
  protected readonly targetLabel = computed(() =>
    formatSecondsLabel(this.game.targetCentiseconds()),
  );
  protected readonly value = computed(() =>
    formatCentiseconds(this.game.timer.elapsedCentiseconds()),
  );
  protected readonly buttonLabel = computed(() => {
    switch (this.game.timer.state()) {
      case 'READY':
        return 'Iniciar cronômetro';
      case 'RUNNING':
        return 'Parar cronômetro';
      case 'FINISHED':
        return 'Tentativa finalizada';
      case 'TIMED_OUT':
        return 'Tempo esgotado';
    }
  });
  protected readonly differenceLabel = computed(() => {
    const result = this.game.result();
    return result?.status === 'ERROU' ? formatDifference(result.differenceCentiseconds) : '';
  });
  protected readonly resultLabel = computed(() => {
    const result = this.game.result();
    return result && result.status !== 'DNF' ? formatSecondsLabel(result.elapsedCentiseconds) : '';
  });
  private readonly injector = inject(Injector);
  private readonly device = viewChild.required<GameDevice, ElementRef<HTMLElement>>('device', {
    read: ElementRef,
  });

  protected onAction(): void {
    if (this.settingsOpen()) return;
    if (this.game.timer.state() === 'READY') this.game.start();
    else if (this.game.timer.state() === 'RUNNING') this.game.stop();
  }

  protected nextAttempt(): void {
    if (!this.game.nextAttempt()) return;
    afterNextRender(() => this.device().nativeElement.querySelector('button')?.focus(), {
      injector: this.injector,
    });
  }
}
