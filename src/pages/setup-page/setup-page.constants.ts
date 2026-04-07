import type { ColorSchemeId, GameMode, HintsBudget, TeamCount } from '@/entities/game/types';

export const SETUP_TEAM_COUNTS: readonly TeamCount[] = [2, 3, 4];

export const SETUP_HINT_BUDGETS: readonly HintsBudget[] = [1, 2, 3];

export const SETUP_MODE_OPTIONS: ReadonlyArray<{ mode: GameMode; label: string }> = [
  { mode: 'nationalTop15', label: 'Сборные ТОП-15' },
  { mode: 'nationalTop30', label: 'Сборные ТОП-30' },
  { mode: 'clubs', label: 'Клубы' },
];

/** Формат подсказки «Лучший состав»: только стартовые 11 или ещё и запасные. */
export const SETUP_BEST_LINEUP_BENCH_OPTIONS: ReadonlyArray<{ includeBench: boolean; label: string }> = [
  { includeBench: true, label: 'Со скамейкой' },
  { includeBench: false, label: 'Без скамейки' },
];

export const SETUP_SCHEME_OPTIONS: ReadonlyArray<{ id: ColorSchemeId; label: string }> = [
  { id: 'green', label: 'Зелёная' },
  { id: 'red', label: 'Красная' },
  { id: 'blue', label: 'Синяя' },
  { id: 'white', label: 'Белая' },
];
