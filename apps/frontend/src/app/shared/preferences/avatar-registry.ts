// Temporary, locally authored vector avatars. Replace this registry when final assets exist.
export const AVATARS = [
  { id: 'spark', name: 'Faísca', path: 'M16 2 20 11 30 16 20 21 16 30 12 21 2 16 12 11Z' },
  { id: 'bolt', name: 'Raio', path: 'M18 2 6 19 15 19 13 30 26 12 17 12Z' },
  { id: 'orbit', name: 'Órbita', path: 'M26 16a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM2 24 30 8' },
  {
    id: 'wave',
    name: 'Onda',
    path: 'M3 10Q9 2 16 10T29 10M3 18Q9 10 16 18T29 18M3 26Q9 18 16 26T29 26',
  },
] as const;

export type AvatarId = (typeof AVATARS)[number]['id'];
