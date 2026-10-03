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
import { ButtonSoundCue } from '../../shared/components/action-button/button-sound';
import { GameDevice } from '../../shared/components/game-device/game-device';
import { SettingsPanel } from '../../shared/components/settings-panel/settings-panel';
import { PreferencesStore } from '../../shared/preferences/preferences-store';
import { formatCentiseconds } from '../../shared/timer/time';
import { TimerEngine } from '../../shared/timer/timer-engine';

@Component({
  selector: 'app-game-device-demo',
  imports: [GameDevice, SettingsPanel],
  providers: [TimerEngine],
  templateUrl: './game-device-demo.html',
  styleUrl: './game-device-demo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameDeviceDemo {
  protected readonly timer = inject(TimerEngine);
  protected readonly preferences = inject(PreferencesStore);
  protected readonly settingsOpen = signal(false);
  protected readonly targetCentiseconds = 1233;
  protected readonly targetLabel = formatCentiseconds(this.targetCentiseconds).replace('.', ',');
  protected readonly value = computed(() => formatCentiseconds(this.timer.elapsedCentiseconds()));
  protected readonly hidden = computed(() => this.timer.state() === 'RUNNING');
  protected readonly soundCue = computed<ButtonSoundCue>(() =>
    this.timer.state() === 'RUNNING' ? 'end' : 'start',
  );
  protected readonly buttonLabel = computed(() => {
    switch (this.timer.state()) {
      case 'READY':
        return 'Iniciar cronômetro';
      case 'RUNNING':
        return 'Parar cronômetro';
      case 'FINISHED':
        return 'Cronômetro finalizado';
    }
  });
  protected readonly prompt = computed(() => {
    switch (this.timer.state()) {
      case 'READY':
        return 'SUA VEZ';
      case 'RUNNING':
        return 'EM ANDAMENTO';
      case 'FINISHED':
        return 'FINALIZADO';
    }
  });
  private readonly injector = inject(Injector);
  private readonly device = viewChild.required<GameDevice, ElementRef<HTMLElement>>('device', {
    read: ElementRef,
  });

  protected onAction(): void {
    if (this.settingsOpen()) return;
    if (this.timer.state() === 'READY') this.timer.start();
    else if (this.timer.state() === 'RUNNING') this.timer.stop();
  }

  protected resetDemo(): void {
    this.timer.reset();
    afterNextRender(() => this.device().nativeElement.querySelector('button')?.focus(), {
      injector: this.injector,
    });
  }
}
