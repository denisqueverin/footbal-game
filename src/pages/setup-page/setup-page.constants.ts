import type { ColorSchemeId, GameMode, TeamCount } from '@/entities/game/types';

export const SETUP_TEAM_COUNTS: readonly TeamCount[] = [2, 3, 4];

export const SETUP_MODE_OPTIONS: ReadonlyArray<{ mode: GameMode; label: string }> = [
  { mode: 'national', label: 'Сборные' },
  { mode: 'clubs', label: 'Клубы' },
];

export const SETUP_SCHEME_OPTIONS: ReadonlyArray<{ id: ColorSchemeId; label: string }> = [
  { id: 'green', label: 'Зелёная' },
  { id: 'red', label: 'Красная' },
  { id: 'blue', label: 'Синяя' },
  { id: 'white', label: 'Белая' },
];
