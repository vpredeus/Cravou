import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/streak/streak-page').then((m) => m.StreakPage),
    title: 'Cravou! · Streak',
  },
  {
    path: 'device-demo',
    loadComponent: () =>
      import('./features/game-device-demo/game-device-demo').then((m) => m.GameDeviceDemo),
  },
];
