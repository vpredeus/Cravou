import { TestBed } from '@angular/core/testing';
import { PreferencesStore } from './preferences-store';

describe('PreferencesStore', () => {
  it('keeps editable profile, appearance and sound preferences in the current session', () => {
    const preferences = TestBed.inject(PreferencesStore);
    preferences.setNickname('Ana Maria');
    preferences.setAvatar('wave');
    preferences.setAccentColor('#66c9ff');
    preferences.setBackgroundColor('#162030');
    preferences.setSoundEnabled(false);
    expect(TestBed.inject(PreferencesStore)).toBe(preferences);
    expect(preferences.profile()).toEqual({ nickname: 'Ana Maria', avatarId: 'wave' });
    expect(preferences.accentColor()).toBe('#66c9ff');
    expect(preferences.backgroundColor()).toBe('#162030');
    expect(preferences.soundEnabled()).toBe(false);
    preferences.setSoundEnabled(true);
    expect(preferences.soundEnabled()).toBe(true);
  });

  it('initializes colors from the existing theme without replacing session choices', () => {
    const preferences = TestBed.inject(PreferencesStore);
    expect(preferences.accentColor()).toBeNull();
    expect(preferences.backgroundColor()).toBeNull();
    preferences.initializeAppearance('#112233', '#334455');
    preferences.setAccentColor('#aabbcc');
    preferences.initializeAppearance('#ffffff', '#000000');
    expect(preferences.accentColor()).toBe('#aabbcc');
    expect(preferences.backgroundColor()).toBe('#334455');
  });

  it('starts a new application session with the temporary defaults', () => {
    const preferences = TestBed.inject(PreferencesStore);
    preferences.setNickname('Outra pessoa');
    preferences.setSoundEnabled(false);
    TestBed.resetTestingModule();
    const newSession = TestBed.inject(PreferencesStore);
    expect(newSession.profile().nickname).toBe('Jogador');
    expect(newSession.soundEnabled()).toBe(true);
    expect(newSession.accentColor()).toBeNull();
  });
});
