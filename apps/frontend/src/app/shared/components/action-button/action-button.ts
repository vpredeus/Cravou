import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ButtonSound, ButtonSoundCue } from './button-sound';

const FEEDBACK_DURATION_MS = 120;
const INTERACTIVE_TARGETS =
  'a, button, input, textarea, select, summary, [contenteditable]:not([contenteditable="false"]), [role], [tabindex], [inert]';

@Component({
  selector: 'app-action-button',
  templateUrl: './action-button.html',
  styleUrl: './action-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onKeyDown($event)',
    '(document:keyup)': 'onKeyUp($event)',
    '(window:pointerup)': 'onPointerEnd($event)',
    '(window:pointercancel)': 'onPointerEnd($event)',
    '(window:blur)': 'resetInteraction()',
  },
})
export class ActionButton implements OnDestroy {
  readonly label = input('Acionar dispositivo');
  readonly disabled = input(false);
  readonly soundEnabled = input(true);
  readonly soundCue = input<ButtonSoundCue>('start');
  // Enable the unfocused Space shortcut only for the active device on the screen.
  readonly keyboardShortcut = input(false);
  readonly action = output<void>();

  protected readonly pressed = signal(false);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly sound = new ButtonSound();
  private pointerId: number | null = null;
  private heldKey: string | null = null;
  private feedbackTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      if (this.disabled()) {
        this.pointerId = null;
        this.heldKey = null;
      }
    });
    effect(() => {
      if (this.soundEnabled()) this.sound.preload();
      else this.sound.stop();
    });
  }

  protected onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 || !event.isPrimary || this.disabled()) return;
    if (this.pointerId !== null || this.heldKey !== null) return;
    this.pointerId = event.pointerId;
    this.activate();
  }

  protected onPointerEnd(event: PointerEvent): void {
    if (event.pointerId === this.pointerId) this.pointerId = null;
  }

  protected onClick(event: MouseEvent): void {
    // Pointer presses already fired on pointerdown. detail=0 preserves assistive/native clicks.
    if (event.detail === 0 && this.heldKey === null && this.pointerId === null) this.activate();
  }

  protected onKeyDown(event: KeyboardEvent): void {
    const isSpace = event.code === 'Space' || event.key === ' ';
    const isOwnButton =
      event.target instanceof HTMLButtonElement &&
      this.element.nativeElement.contains(event.target);

    if (!isSpace && !(event.key === 'Enter' && isOwnButton)) return;
    if (
      event.defaultPrevented ||
      event.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    if (this.disabled()) return;
    if (!isOwnButton) {
      if (!isSpace || !this.keyboardShortcut()) return;
      if (event.target instanceof Element && event.target.closest(INTERACTIVE_TARGETS)) return;
    }

    event.preventDefault();
    if (event.repeat || this.heldKey !== null || this.pointerId !== null) return;
    this.heldKey = isSpace ? 'Space' : 'Enter';
    this.activate();
  }

  protected onKeyUp(event: KeyboardEvent): void {
    const key = event.code === 'Space' || event.key === ' ' ? 'Space' : event.key;
    if (key === this.heldKey) {
      event.preventDefault();
      this.heldKey = null;
    }
  }

  protected resetInteraction(): void {
    clearTimeout(this.feedbackTimer);
    this.pointerId = null;
    this.heldKey = null;
    this.pressed.set(false);
  }

  private activate(): void {
    if (this.disabled()) return;
    clearTimeout(this.feedbackTimer);
    this.pressed.set(true);
    this.feedbackTimer = setTimeout(() => this.pressed.set(false), FEEDBACK_DURATION_MS);
    if (this.soundEnabled()) void this.sound.play(this.soundCue());
    this.action.emit();
  }

  ngOnDestroy(): void {
    this.resetInteraction();
    this.sound.dispose();
  }
}
