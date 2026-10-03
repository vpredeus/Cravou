import { ButtonSound } from './button-sound';

describe('ButtonSound', () => {
  afterEach(() => vi.unstubAllGlobals());

  function mockAudio() {
    function createClip(src: string) {
      return {
        src,
        preload: '',
        currentTime: 0,
        play: vi.fn(async () => {}),
        pause: vi.fn(),
        removeAttribute: vi.fn(),
        load: vi.fn(),
      };
    }
    const clips: ReturnType<typeof createClip>[] = [];
    const constructor = vi.fn(function (src: string) {
      const clip = createClip(src);
      clips.push(clip);
      return clip;
    });
    vi.stubGlobal('Audio', constructor);
    return { constructor, clips };
  }

  it('preloads and reuses the two supplied MP3 files without autoplaying', () => {
    const audio = mockAudio();
    const sound = new ButtonSound();
    sound.preload();
    sound.preload();
    expect(audio.constructor.mock.calls).toEqual([
      ['audio/button-press_start.mp3'],
      ['audio/button-press_end.mp3'],
    ]);
    for (const clip of audio.clips) {
      expect(clip.preload).toBe('auto');
      expect(clip.play).not.toHaveBeenCalled();
    }
    sound.dispose();
  });

  it('plays Start by default and End when requested', async () => {
    const audio = mockAudio();
    const sound = new ButtonSound();
    await sound.play();
    expect(audio.clips[0].play).toHaveBeenCalledOnce();
    expect(audio.clips[1].play).not.toHaveBeenCalled();
    await sound.play('end');
    expect(audio.clips[0].play).toHaveBeenCalledOnce();
    expect(audio.clips[1].play).toHaveBeenCalledOnce();
    expect(audio.constructor).toHaveBeenCalledTimes(2);
    sound.dispose();
  });

  it('interrupts any previous sound and restarts the selected clip from its beginning', async () => {
    const audio = mockAudio();
    const sound = new ButtonSound();
    await sound.play('start');
    for (const clip of audio.clips) clip.currentTime = 0.4;
    await sound.play('end');
    for (const clip of audio.clips) {
      expect(clip.pause).toHaveBeenCalledTimes(2);
      expect(clip.currentTime).toBe(0);
    }
    await sound.play('end');
    expect(audio.clips[1].play).toHaveBeenCalledTimes(2);
    sound.dispose();
  });

  it('absorbs playback and browser autoplay policy failures', async () => {
    const audio = mockAudio();
    const sound = new ButtonSound();
    sound.preload();
    audio.clips[0].play.mockRejectedValueOnce(new Error('NotAllowedError'));
    await expect(sound.play('start')).resolves.toBeUndefined();
    await sound.play('end');
    expect(audio.clips[1].play).toHaveBeenCalledOnce();
    sound.dispose();
  });

  it('remains usable when browser audio is unavailable', async () => {
    vi.stubGlobal('Audio', undefined);
    const sound = new ButtonSound();
    sound.preload();
    await expect(sound.play('start')).resolves.toBeUndefined();
    sound.dispose();
  });

  it('immediately stops an active clip when sound is muted', async () => {
    const audio = mockAudio();
    const sound = new ButtonSound();
    await sound.play('start');
    audio.clips[0].currentTime = 0.5;
    sound.stop();
    expect(audio.clips[0].pause).toHaveBeenCalledTimes(2);
    expect(audio.clips[0].currentTime).toBe(0);
    expect(audio.clips[1].play).not.toHaveBeenCalled();
    sound.dispose();
  });

  it('stops and unloads both clips on destruction and does not play again', async () => {
    const audio = mockAudio();
    const sound = new ButtonSound();
    await sound.play('start');
    sound.dispose();
    for (const clip of audio.clips) {
      expect(clip.pause).toHaveBeenCalledTimes(2);
      expect(clip.removeAttribute).toHaveBeenCalledWith('src');
      expect(clip.load).toHaveBeenCalledOnce();
    }
    sound.preload();
    await sound.play('end');
    expect(audio.constructor).toHaveBeenCalledTimes(2);
    expect(audio.clips[1].play).not.toHaveBeenCalled();
  });

  it('cleans up even when a playback request is pending', async () => {
    const audio = mockAudio();
    const sound = new ButtonSound();
    sound.preload();
    let finishPlayback!: () => void;
    audio.clips[0].play.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishPlayback = resolve;
        }),
    );
    const playing = sound.play('start');
    sound.dispose();
    finishPlayback();
    await playing;
    await sound.play('end');
    expect(audio.clips[1].play).not.toHaveBeenCalled();
    expect(audio.clips[0].load).toHaveBeenCalledOnce();
  });
});
