import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/game-device-demo/game-device-demo').then((m) => m.GameDeviceDemo),
  },
];
