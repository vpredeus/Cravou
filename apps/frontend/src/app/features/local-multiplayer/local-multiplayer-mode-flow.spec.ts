import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { LocalMultiplayerPage } from './local-multiplayer-page';
import { LocalMultiplayerModesPage } from './local-multiplayer-modes-page';
import { LocalMultiplayerReadyPage } from './local-multiplayer-ready-page';
import { LocalMultiplayerSessionStore } from './local-multiplayer-session-store';
import { MULTIPLAYER_MODES, MultiplayerModeId } from './multiplayer-modes';

describe('Local multiplayer mode flow', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let session: LocalMultiplayerSessionStore;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
    session = TestBed.inject(LocalMultiplayerSessionStore);
  });

  function modeButton(id: MultiplayerModeId): HTMLButtonElement {
    return harness.routeNativeElement!.querySelector<HTMLButtonElement>(
      `button[aria-labelledby="mode-name-${id}"]`,
    )!;
  }

  function continueButton(): HTMLButtonElement {
    return harness.routeNativeElement!.querySelector<HTMLButtonElement>('.continue')!;
  }

  async function settle(): Promise<void> {
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  async function openModes(): Promise<void> {
    session.initialize();
    await harness.navigateByUrl('/local/multiplayer/modes', LocalMultiplayerModesPage);
  }

  async function back(): Promise<void> {
    harness.routeNativeElement!.querySelector<HTMLAnchorElement>('a[aria-label="Voltar"]')!.click();
    await settle();
  }

  it('renders catalog modes with accessible names/descriptions and no initial selection', async () => {
    await openModes();
    expect(harness.routeNativeElement!.textContent).toContain('ESCOLHA O MODO');
    MULTIPLAYER_MODES.forEach((mode) => {
      const button = modeButton(mode.id);
      expect(button.disabled).toBe(false);
      expect(button.getAttribute('aria-pressed')).toBe('false');
      const nameId = button.getAttribute('aria-labelledby')!;
      const descriptionId = button.getAttribute('aria-describedby')!;
      expect(harness.routeNativeElement!.querySelector(`#${nameId}`)?.textContent).toBe(mode.name);
      expect(harness.routeNativeElement!.querySelector(`#${descriptionId}`)?.textContent).toBe(
        mode.description,
      );
    });
    expect(continueButton().disabled).toBe(true);
    expect(
      harness.routeNativeElement!.querySelector('app-settings-panel, app-game-device'),
    ).toBeNull();
  });

  it('selects only one mode, replaces it and enables Continue without changing players', async () => {
    await openModes();
    const players = session.players();
    for (const mode of MULTIPLAYER_MODES) {
      modeButton(mode.id).click();
      await settle();
      expect(session.selectedMode()).toBe(mode.id);
      expect(modeButton(mode.id).getAttribute('aria-pressed')).toBe('true');
      expect(
        harness.routeNativeElement!.querySelectorAll('button[aria-pressed="true"]'),
      ).toHaveLength(1);
      expect(continueButton().disabled).toBe(false);
      expect(session.players()).toBe(players);
    }
  });

  it('accepts the native button activation event used by keyboard as the same selection action', async () => {
    await openModes();
    const button = modeButton('hit');
    button.focus();
    // Native Enter/Space generates a click with detail 0; jsdom does not synthesize key defaults.
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
    await settle();
    expect(document.activeElement).toBe(button);
    expect(session.selectedMode()).toBe('hit');
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps incompatible cards disabled using metadata', async () => {
    const mode = MULTIPLAYER_MODES[0];
    const originalMetadata = Object.getOwnPropertyDescriptors(mode);
    Object.defineProperty(mode, 'minPlayers', { value: 5 });
    try {
      await openModes();
      expect(modeButton('precision').disabled).toBe(true);
      expect(modeButton('hit').disabled).toBe(false);
      modeButton('precision').click();
      expect(session.selectedMode()).toBeNull();
      expect(continueButton().disabled).toBe(true);
    } finally {
      Object.defineProperties(mode, originalMetadata);
    }
  });

  it('does not navigate when Continue is disabled', async () => {
    await openModes();
    continueButton().click();
    await settle();
    expect(router.url).toBe('/local/multiplayer/modes');
  });

  it('opens a real group/mode summary and restores selection on return', async () => {
    await openModes();
    session.updatePlayerName(session.players()[0].id, 'João');
    session.updatePlayerAvatar(session.players()[0].id, 'wave');
    const players = session.players();
    modeButton('challenge').click();
    await settle();
    continueButton().click();
    await settle();
    expect(router.url).toBe('/local/multiplayer/match');
    expect(harness.routeNativeElement!.textContent).toContain('GRUPO PRONTO');
    expect(harness.routeNativeElement!.querySelector('.selected-mode strong')?.textContent).toBe(
      'Duvidar',
    );
    expect(harness.routeNativeElement!.querySelectorAll('ol li')).toHaveLength(players.length);
    expect(harness.routeNativeElement!.textContent).toContain('João');
    expect(
      harness.routeNativeElement!.querySelector('app-game-device, app-settings-panel'),
    ).toBeNull();
    expect(session.players()).toBe(players);
    await back();
    expect(router.url).toBe('/local/multiplayer/modes');
    expect(modeButton('challenge').getAttribute('aria-pressed')).toBe('true');
    expect(continueButton().disabled).toBe(false);
    expect(session.players()).toBe(players);
  });

  it('preserves selection and players after returning to setup and changing group size', async () => {
    await openModes();
    modeButton('precision').click();
    await settle();
    const firstPlayer = session.players()[0];
    await back();
    expect(router.url).toBe('/local/multiplayer');
    session.setPlayerCount(8);
    await settle();
    continueButton().click();
    await settle();
    expect(router.url).toBe('/local/multiplayer/modes');
    expect(session.players()[0]).toEqual(firstPlayer);
    expect(modeButton('precision').getAttribute('aria-pressed')).toBe('true');
    expect(session.playerCount()).toBe(8);
  });

  it('redirects direct summary access without players to setup', async () => {
    await harness.navigateByUrl('/local/multiplayer/match', LocalMultiplayerPage);
    expect(router.url).toBe('/local/multiplayer');
    expect(session.selectedMode()).toBeNull();
  });

  it('redirects direct summary access with players but no mode to mode selection', async () => {
    session.initialize();
    await harness.navigateByUrl('/local/multiplayer/match', LocalMultiplayerModesPage);
    expect(router.url).toBe('/local/multiplayer/modes');
    expect(continueButton().disabled).toBe(true);
  });

  it('redirects an invalid group even when a mode was previously selected', async () => {
    session.initialize();
    session.selectMode('hit');
    session.updatePlayerName(session.players()[0].id, ' ');
    await harness.navigateByUrl('/local/multiplayer/match', LocalMultiplayerPage);
    expect(router.url).toBe('/local/multiplayer');
    expect(session.selectedMode()).toBe('hit');
  });

  it('allows direct summary access when both players and selected mode are valid', async () => {
    session.initialize();
    session.selectMode('precision');
    await harness.navigateByUrl('/local/multiplayer/match', LocalMultiplayerReadyPage);
    expect(router.url).toBe('/local/multiplayer/match');
    expect(harness.routeNativeElement!.querySelector('.selected-mode strong')?.textContent).toBe(
      'Precisão',
    );
  });
});
