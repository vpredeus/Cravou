import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { PreferencesStore } from './shared/preferences/preferences-store';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('applies session display and background colors to the application theme', async () => {
    const fixture = TestBed.createComponent(App);
    const preferences = TestBed.inject(PreferencesStore);
    preferences.setAccentColor('#66c9ff');
    preferences.setBackgroundColor('#162030');
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.style.getPropertyValue('--accent-color')).toBe('#66c9ff');
    expect(element.style.getPropertyValue('--game-background')).toBe('#162030');
  });

  it('should provide the outlet for routed screens', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });
});
