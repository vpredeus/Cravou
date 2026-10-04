import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { PreferencesStore } from '../../shared/preferences/preferences-store';
import { LocalMultiplayerPage } from './local-multiplayer-page';
import { LocalMultiplayerModesPage } from './local-multiplayer-modes-page';
import { LocalMultiplayerSessionStore } from './local-multiplayer-session-store';
import { INITIAL_LOCAL_PLAYERS, MAX_LOCAL_PLAYERS, MIN_LOCAL_PLAYERS } from './local-player';

describe('Local multiplayer session flow', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let session: LocalMultiplayerSessionStore;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
    session = TestBed.inject(LocalMultiplayerSessionStore);
  });

  function button(label: string): HTMLButtonElement {
    return harness.routeNativeElement!.querySelector<HTMLButtonElement>(
      `button[aria-label="${label}"]`,
    )!;
  }

  function continueButton(): HTMLButtonElement {
    return harness.routeNativeElement!.querySelector<HTMLButtonElement>('.continue')!;
  }

  function nameInput(position = 0): HTMLInputElement {
    return harness.routeNativeElement!.querySelectorAll<HTMLInputElement>('.name-field input')[
      position
    ];
  }

  async function editName(value: string, position = 0): Promise<void> {
    const input = nameInput(position);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  it('renders four editable players, valid Continue, the back icon and no Settings or device', async () => {
    await harness.navigateByUrl('/local/multiplayer', LocalMultiplayerPage);
    expect(harness.routeNativeElement!.textContent).toContain('MONTE O GRUPO');
    expect(harness.routeNativeElement!.querySelectorAll('app-player-editor')).toHaveLength(
      INITIAL_LOCAL_PLAYERS,
    );
    expect(harness.routeNativeElement!.querySelector('output')?.textContent?.trim()).toBe('4');
    expect(nameInput().labels?.[0]?.textContent).toBe('Nome do jogador 1');
    expect(continueButton().disabled).toBe(false);
    expect(
      harness.routeNativeElement!.querySelector('app-settings-panel, app-game-device'),
    ).toBeNull();
    expect(
      harness.routeNativeElement!.querySelector('a[aria-label="Voltar"]')?.getAttribute('href'),
    ).toBe('/local');
  });

  it('adds/removes players through controls and disables the bounds', async () => {
    await harness.navigateByUrl('/local/multiplayer', LocalMultiplayerPage);
    button('Aumentar quantidade de jogadores').click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelectorAll('app-player-editor')).toHaveLength(5);
    button('Diminuir quantidade de jogadores').click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(session.playerCount()).toBe(INITIAL_LOCAL_PLAYERS);
    for (let count = INITIAL_LOCAL_PLAYERS; count > MIN_LOCAL_PLAYERS; count--) {
      button('Diminuir quantidade de jogadores').click();
      await harness.fixture.whenStable();
      harness.detectChanges();
    }
    expect(button('Diminuir quantidade de jogadores').disabled).toBe(true);
    button('Diminuir quantidade de jogadores').click();
    expect(session.playerCount()).toBe(MIN_LOCAL_PLAYERS);
    for (let count = MIN_LOCAL_PLAYERS; count < MAX_LOCAL_PLAYERS; count++) {
      button('Aumentar quantidade de jogadores').click();
      await harness.fixture.whenStable();
      harness.detectChanges();
    }
    expect(harness.routeNativeElement!.querySelectorAll('app-player-editor')).toHaveLength(
      MAX_LOCAL_PLAYERS,
    );
    expect(button('Aumentar quantidade de jogadores').disabled).toBe(true);
    button('Aumentar quantidade de jogadores').click();
    expect(session.playerCount()).toBe(MAX_LOCAL_PLAYERS);
  });

  it('edits name and avatar by stable ID without altering the global profile', async () => {
    const preferences = TestBed.inject(PreferencesStore);
    const profile = preferences.profile();
    await harness.navigateByUrl('/local/multiplayer', LocalMultiplayerPage);
    const id = session.players()[0].id;
    await editName('João Pedro');
    harness
      .routeNativeElement!.querySelector<HTMLInputElement>(
        `input[name="player-avatar-${id}"][value="wave"]`,
      )!
      .click();
    await harness.fixture.whenStable();
    expect(session.players()[0]).toEqual({ id, name: 'João Pedro', avatarId: 'wave' });
    expect(preferences.profile()).toEqual(profile);
  });

  it.each(['', '   '])(
    'blocks Continue for invalid name %j and recovers after editing',
    async (name) => {
      await harness.navigateByUrl('/local/multiplayer', LocalMultiplayerPage);
      await editName(name);
      expect(continueButton().disabled).toBe(true);
      expect(nameInput().getAttribute('aria-invalid')).toBe('true');
      const errorId = nameInput().getAttribute('aria-describedby')!;
      expect(harness.routeNativeElement!.querySelector(`[id="${errorId}"]`)?.textContent).toContain(
        'Preencha o nome',
      );
      continueButton().click();
      expect(router.url).toBe('/local/multiplayer');
      await editName('Ana');
      expect(continueButton().disabled).toBe(false);
      expect(nameInput().hasAttribute('aria-invalid')).toBe(false);
    },
  );

  it('continues to a group summary and preserves names, avatars and IDs on return', async () => {
    await harness.navigateByUrl('/local/multiplayer', LocalMultiplayerPage);
    await editName('  Maria Clara  ');
    const id = session.players()[0].id;
    session.updatePlayerAvatar(id, 'wave');
    continueButton().click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(router.url).toBe('/local/multiplayer/modes');
    harness
      .routeNativeElement!.querySelector<HTMLButtonElement>(
        'button[aria-labelledby="mode-name-precision"]',
      )!
      .click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    continueButton().click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(router.url).toBe('/local/multiplayer/match');
    expect(harness.routeNativeElement!.textContent).toContain('GRUPO PRONTO');
    expect(harness.routeNativeElement!.textContent).toContain('4 jogadores');
    expect(harness.routeNativeElement!.querySelectorAll('ol li')).toHaveLength(
      INITIAL_LOCAL_PLAYERS,
    );
    expect(harness.routeNativeElement!.textContent).toContain('Maria Clara');
    expect(
      harness.routeNativeElement!.querySelector('app-settings-panel, app-game-device'),
    ).toBeNull();
    harness.routeNativeElement!.querySelector<HTMLAnchorElement>('a[aria-label="Voltar"]')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(router.url).toBe('/local/multiplayer/modes');
    expect(session.selectedMode()).toBe('precision');
    harness.routeNativeElement!.querySelector<HTMLAnchorElement>('a[aria-label="Voltar"]')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(router.url).toBe('/local/multiplayer');
    expect(nameInput().value).toBe('Maria Clara');
    expect(session.players()[0]).toEqual({ id, name: 'Maria Clara', avatarId: 'wave' });
    expect(
      harness.routeNativeElement!.querySelector<HTMLInputElement>(
        `input[name="player-avatar-${id}"][value="wave"]`,
      )?.checked,
    ).toBe(true);
  });

  it('preserves the group when navigating away to Local and back', async () => {
    await harness.navigateByUrl('/local/multiplayer', LocalMultiplayerPage);
    await editName('Lucas');
    const group = session.players();
    await harness.navigateByUrl('/local');
    await harness.navigateByUrl('/local/multiplayer', LocalMultiplayerPage);
    expect(session.players()).toBe(group);
    expect(nameInput().value).toBe('Lucas');
  });

  it('redirects a direct next-step visit with no session to setup', async () => {
    expect(session.isValid()).toBe(false);
    await harness.navigateByUrl('/local/multiplayer/modes', LocalMultiplayerPage);
    expect(router.url).toBe('/local/multiplayer');
    expect(session.playerCount()).toBe(INITIAL_LOCAL_PLAYERS);
  });

  it('redirects an invalid existing group without replacing the unfinished edit', async () => {
    session.initialize();
    session.updatePlayerName(session.players()[0].id, ' ');
    await harness.navigateByUrl('/local/multiplayer/modes', LocalMultiplayerPage);
    expect(router.url).toBe('/local/multiplayer');
    expect(nameInput().value).toBe(' ');
    expect(continueButton().disabled).toBe(true);
  });

  it('allows the next-step route when an actual valid session exists', async () => {
    session.initialize();
    await harness.navigateByUrl('/local/multiplayer/modes', LocalMultiplayerModesPage);
    expect(router.url).toBe('/local/multiplayer/modes');
    expect(harness.routeNativeElement!.textContent).toContain('ESCOLHA O MODO');
  });
});
