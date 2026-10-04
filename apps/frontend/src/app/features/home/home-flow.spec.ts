import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { GameDeviceDemo } from '../game-device-demo/game-device-demo';
import { LocalEntryPage } from '../local/local-entry-page';
import { OnlineEntryPage } from '../online/online-entry-page';
import { OnlineJoinPage } from '../online/online-join-page';
import { StreakPage } from '../streak/streak-page';
import { HomePage } from './home-page';

describe('Home entry flow', () => {
  let harness: RouterTestingHarness;
  let router: Router;

  beforeEach(async () => {
    vi.stubGlobal('Audio', undefined);
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
  });

  afterEach(() => vi.unstubAllGlobals());

  async function follow(destination: string): Promise<void> {
    const link = harness.routeNativeElement?.querySelector<HTMLAnchorElement>(
      `a[href="${destination}"]`,
    );
    expect(link).not.toBeNull();
    link!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(router.url).toBe(destination);
  }

  it('opens Home at / with both choices and without Settings', async () => {
    await harness.navigateByUrl('/', HomePage);
    const page = harness.routeNativeElement!;
    expect(page.querySelector('h1')?.textContent).toBe('Bem-vindo');
    expect(page.textContent).toContain('JOGAR LOCAL');
    expect(page.textContent).toContain('JOGAR ONLINE');
    expect(page.querySelector('app-settings-panel')).toBeNull();
  });

  it('follows Home → Local → existing Streak and returns through Local to Home', async () => {
    await harness.navigateByUrl('/', HomePage);
    await follow('/local');
    expect(harness.routeNativeElement?.textContent).toContain('SINGLE PLAYER');
    expect(harness.routeNativeElement?.textContent).toContain('MULTIPLAYER');
    await follow('/streak');
    expect(harness.routeNativeElement?.querySelector('app-game-device')).not.toBeNull();
    await follow('/local');
    await follow('/');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('Bem-vindo');
  });

  it('opens local group setup and returns to Local', async () => {
    await harness.navigateByUrl('/local', LocalEntryPage);
    await follow('/local/multiplayer');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('MULTIPLAYER LOCAL');
    expect(harness.routeNativeElement?.textContent).toContain('MONTE O GRUPO');
    expect(harness.routeNativeElement?.querySelectorAll('app-player-editor')).toHaveLength(4);
    expect(
      harness.routeNativeElement?.querySelector('app-game-device, input[type="number"]'),
    ).toBeNull();
    await follow('/local');
  });

  it('follows Home → Online → Create and returns to Online and Home', async () => {
    await harness.navigateByUrl('/', HomePage);
    await follow('/online');
    expect(harness.routeNativeElement?.querySelector('#online-nickname')).not.toBeNull();
    expect(harness.routeNativeElement?.querySelector('.current-avatar')).not.toBeNull();
    await follow('/online/create');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toBe('CRIAR GRUPO');
    expect(harness.routeNativeElement?.textContent).toContain('próxima etapa');
    await follow('/online');
    await follow('/');
  });

  it('opens Join with a code field, without imposing an arbitrary code length', async () => {
    await harness.navigateByUrl('/online', OnlineEntryPage);
    await follow('/online/join');
    const input = harness.routeNativeElement?.querySelector<HTMLInputElement>('#group-code');
    expect(input?.hasAttribute('maxlength')).toBe(false);
    expect(input?.labels?.[0]?.textContent).toBe('Código do grupo');
    await follow('/online');
  });

  it('normalizes the code and proceeds only to the next-step notice', async () => {
    await harness.navigateByUrl('/online/join', OnlineJoinPage);
    const input = harness.routeNativeElement!.querySelector<HTMLInputElement>('#group-code')!;
    input.value = '  ab123456789  ';
    input.dispatchEvent(new Event('input'));
    await harness.fixture.whenStable();
    expect(input.value).toBe('  AB123456789  ');
    harness
      .routeNativeElement!.querySelector('form')!
      .dispatchEvent(new Event('submit', { cancelable: true }));
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(router.url).toBe('/online/join/next');
    expect(harness.routeNativeElement?.textContent).toContain('validação do código');
    await follow('/online');
  });

  it('does not advance with a whitespace-only code', async () => {
    await harness.navigateByUrl('/online/join', OnlineJoinPage);
    const input = harness.routeNativeElement!.querySelector<HTMLInputElement>('#group-code')!;
    input.value = '   ';
    input.dispatchEvent(new Event('input'));
    harness
      .routeNativeElement!.querySelector('form')!
      .dispatchEvent(new Event('submit', { cancelable: true }));
    await harness.fixture.whenStable();
    expect(router.url).toBe('/online/join');
  });

  it('preserves direct access to Streak and the development demo', async () => {
    await harness.navigateByUrl('/streak', StreakPage);
    expect(harness.routeNativeElement?.querySelector('app-game-device')).not.toBeNull();
    expect(harness.routeNativeElement?.querySelector('app-settings-panel')).not.toBeNull();
    await harness.navigateByUrl('/device-demo', GameDeviceDemo);
    expect(harness.routeNativeElement?.querySelector('app-game-device')).not.toBeNull();
    expect(harness.routeNativeElement?.querySelector('app-settings-panel')).not.toBeNull();
  });

  it.each([
    ['/local', '/'],
    ['/local/multiplayer', '/local'],
    ['/online', '/'],
    ['/online/create', '/online'],
    ['/online/join', '/online'],
    ['/online/join/next', '/online'],
    ['/streak', '/local'],
  ])('returns from %s to %s using the accessible back icon', async (url, parent) => {
    await harness.navigateByUrl(url);
    const back =
      harness.routeNativeElement!.querySelector<HTMLAnchorElement>('a[aria-label="Voltar"]')!;
    expect(back.textContent?.trim()).toBe('');
    expect(back.getAttribute('href')).toBe(parent);
    back.click();
    await harness.fixture.whenStable();
    expect(router.url).toBe(parent);
  });

  it.each([
    '/',
    '/local',
    '/local/multiplayer',
    '/online',
    '/online/create',
    '/online/join',
    '/online/join/next',
  ])('keeps Settings out of the entry screen %s', async (url) => {
    await harness.navigateByUrl(url);
    expect(harness.routeNativeElement?.querySelector('app-settings-panel')).toBeNull();
  });

  it('shares profile edits between Online and Settings on the game page', async () => {
    await harness.navigateByUrl('/online', OnlineEntryPage);
    const onlineNickname =
      harness.routeNativeElement!.querySelector<HTMLInputElement>('#online-nickname')!;
    onlineNickname.value = 'Ana Maria';
    onlineNickname.dispatchEvent(new Event('input'));
    harness
      .routeNativeElement!.querySelector<HTMLInputElement>(
        'input[name="online-avatar"][value="wave"]',
      )!
      .click();
    await harness.fixture.whenStable();

    await harness.navigateByUrl('/streak', StreakPage);
    const settingsNickname =
      harness.routeNativeElement!.querySelector<HTMLInputElement>('#session-nickname')!;
    expect(settingsNickname.value).toBe('Ana Maria');
    expect(
      harness.routeNativeElement!.querySelector<HTMLInputElement>(
        'input[name="session-avatar"][value="wave"]',
      )?.checked,
    ).toBe(true);
    settingsNickname.value = 'Lia Silva';
    settingsNickname.dispatchEvent(new Event('input'));
    harness
      .routeNativeElement!.querySelector<HTMLInputElement>(
        'input[name="session-avatar"][value="bolt"]',
      )!
      .click();
    await harness.fixture.whenStable();

    await harness.navigateByUrl('/online', OnlineEntryPage);
    expect(
      harness.routeNativeElement!.querySelector<HTMLInputElement>('#online-nickname')?.value,
    ).toBe('Lia Silva');
    expect(
      harness.routeNativeElement!.querySelector<HTMLInputElement>(
        'input[name="online-avatar"][value="bolt"]',
      )?.checked,
    ).toBe(true);
  });
});
