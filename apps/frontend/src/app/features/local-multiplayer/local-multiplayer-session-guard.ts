import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LocalMultiplayerSessionStore } from './local-multiplayer-session-store';

export const localMultiplayerSessionGuard: CanActivateFn = () =>
  inject(LocalMultiplayerSessionStore).isValid() ||
  inject(Router).createUrlTree(['/local/multiplayer']);
