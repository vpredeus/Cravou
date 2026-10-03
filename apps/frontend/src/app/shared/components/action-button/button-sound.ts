export type ButtonSoundCue = 'start' | 'end';

const SOUND_SOURCES: Readonly<Record<ButtonSoundCue, string>> = {
  start: 'audio/button-press_start.mp3',
  end: 'audio/button-press_end.mp3',
};

export class ButtonSound {
  private clips?: Record<ButtonSoundCue, HTMLAudioElement>;
  private disposed = false;

  preload(): void {
    if (this.disposed || this.clips || typeof Audio === 'undefined') return;

    try {
      this.clips = {
        start: new Audio(SOUND_SOURCES.start),
        end: new Audio(SOUND_SOURCES.end),
      };
      for (const clip of Object.values(this.clips)) clip.preload = 'auto';
    } catch {
      // Unsupported audio must not prevent the button from working.
    }
  }

  async play(cue: ButtonSoundCue = 'start'): Promise<void> {
    if (this.disposed) return;

    try {
      this.preload();
      if (!this.clips) return;
      this.stop();
      await this.clips[cue].play();
    } catch {
      // Loading errors or autoplay policy must never block the action.
    }
  }

  stop(): void {
    if (!this.clips) return;
    for (const clip of Object.values(this.clips)) {
      clip.pause();
      clip.currentTime = 0;
    }
  }

  dispose(): void {
    this.disposed = true;
    if (!this.clips) return;
    for (const clip of Object.values(this.clips)) {
      clip.pause();
      clip.removeAttribute('src');
      clip.load();
    }
    this.clips = undefined;
  }
}
