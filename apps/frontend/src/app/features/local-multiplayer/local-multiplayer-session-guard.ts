import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LocalMultiplayerSessionStore } from './local-multiplayer-session-store';

export const localMultiplayerSessionGuard: CanActivateFn = () =>
  inject(LocalMultiplayerSessionStore).isValid() ||
  inject(Router).createUrlTree(['/local/multiplayer']);

export const localMultiplayerModeGuard: CanActivateFn = () => {
  const session = inject(LocalMultiplayerSessionStore);
  const router = inject(Router);
  if (!session.isValid()) return router.createUrlTree(['/local/multiplayer']);
  return session.hasValidMode() || router.createUrlTree(['/local/multiplayer/modes']);
};
