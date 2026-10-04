import { Routes } from '@angular/router';
import type { NextStepContent } from './features/home/next-step-page';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/home-page').then((m) => m.HomePage),
    title: 'Cravou!',
  },
  {
    path: 'local',
    loadComponent: () => import('./features/local/local-entry-page').then((m) => m.LocalEntryPage),
    title: 'Cravou! · Jogar local',
  },
  {
    path: 'local/multiplayer',
    loadComponent: () => import('./features/home/next-step-page').then((m) => m.NextStepPage),
    title: 'Cravou! · Multiplayer local',
    data: {
      heading: 'MULTIPLAYER LOCAL',
      subtitle: 'Configuração de grupo',
      notice: 'A preparação do grupo será implementada na próxima etapa.',
      backTo: '/local',
    } satisfies NextStepContent,
  },
  {
    path: 'streak',
    loadComponent: () => import('./features/streak/streak-page').then((m) => m.StreakPage),
    title: 'Cravou! · Streak',
  },
  {
    path: 'online',
    loadComponent: () =>
      import('./features/online/online-entry-page').then((m) => m.OnlineEntryPage),
    title: 'Cravou! · Jogar online',
  },
  {
    path: 'online/create',
    loadComponent: () => import('./features/home/next-step-page').then((m) => m.NextStepPage),
    title: 'Cravou! · Criar grupo',
    data: {
      heading: 'CRIAR GRUPO',
      subtitle: 'Preparação do grupo',
      notice: 'A configuração e a criação do grupo serão adicionadas na próxima etapa.',
      backTo: '/online',
    } satisfies NextStepContent,
  },
  {
    path: 'online/join',
    loadComponent: () => import('./features/online/online-join-page').then((m) => m.OnlineJoinPage),
    title: 'Cravou! · Entrar em grupo',
  },
  {
    path: 'online/join/next',
    loadComponent: () => import('./features/home/next-step-page').then((m) => m.NextStepPage),
    title: 'Cravou! · Entrada no grupo',
    data: {
      heading: 'ENTRAR EM GRUPO',
      subtitle: 'Entrada no grupo',
      notice: 'A validação do código e a conexão com o grupo serão adicionadas na próxima etapa.',
      backTo: '/online',
    } satisfies NextStepContent,
  },
  {
    path: 'device-demo',
    loadComponent: () =>
      import('./features/game-device-demo/game-device-demo').then((m) => m.GameDeviceDemo),
  },
];
