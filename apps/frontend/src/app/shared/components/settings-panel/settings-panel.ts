import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { AVATARS } from '../../preferences/avatar-registry';
import { PreferencesStore } from '../../preferences/preferences-store';
import { ProfileAvatar } from '../profile-avatar/profile-avatar';

const VIEWPORT_GUTTER = 16;
const PANEL_GAP = 8;

@Component({
  selector: 'app-settings-panel',
  imports: [ProfileAvatar],
  templateUrl: './settings-panel.html',
  styleUrl: './settings-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:resize)': 'reposition()' },
})
export class SettingsPanel {
  readonly openedChange = output<boolean>();
  protected readonly preferences = inject(PreferencesStore);
  protected readonly avatars = AVATARS;
  protected readonly opened = signal(false);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');

  constructor() {
    afterNextRender(() => {
      const style = getComputedStyle(this.element.nativeElement);
      this.preferences.initializeAppearance(
        style.getPropertyValue('--accent-color').trim(),
        style.getPropertyValue('--game-background').trim(),
      );
    });
  }

  protected onBeforeToggle(event: Event): void {
    const open = (event as ToggleEvent).newState === 'open';
    this.opened.set(open);
    this.openedChange.emit(open);
  }

  protected onToggle(): void {
    this.reposition();
  }

  protected reposition(): void {
    if (!this.opened()) return;
    const panel = this.panel().nativeElement;
    const trigger = this.trigger().nativeElement.getBoundingClientRect();
    const viewport = panel.ownerDocument.documentElement;
    const width = panel.getBoundingClientRect().width;
    const left = Math.max(
      VIEWPORT_GUTTER,
      Math.min(trigger.right - width, viewport.clientWidth - width - VIEWPORT_GUTTER),
    );
    const below = viewport.clientHeight - trigger.bottom - PANEL_GAP - VIEWPORT_GUTTER;
    const above = trigger.top - PANEL_GAP - VIEWPORT_GUTTER;
    const placeBelow = below >= above;
    const availableHeight = Math.max(0, placeBelow ? below : above);
    const top = placeBelow
      ? trigger.bottom + PANEL_GAP
      : Math.max(
          VIEWPORT_GUTTER,
          trigger.top - PANEL_GAP - Math.min(panel.getBoundingClientRect().height, availableHeight),
        );
    panel.style.setProperty('--panel-left', `${left}px`);
    panel.style.setProperty('--panel-top', `${top}px`);
    panel.style.maxHeight = `${availableHeight}px`;
  }

  protected editNickname(event: Event): void {
    this.preferences.setNickname((event.target as HTMLInputElement).value);
  }

  protected editAccent(event: Event): void {
    this.preferences.setAccentColor((event.target as HTMLInputElement).value);
  }

  protected editBackground(event: Event): void {
    this.preferences.setBackgroundColor((event.target as HTMLInputElement).value);
  }
}
