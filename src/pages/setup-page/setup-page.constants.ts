import type { ColorSchemeId, GameMode, HintsBudget, TeamCount } from '@/entities/game/core/types';

export const SETUP_TEAM_COUNTS: readonly TeamCount[] = [2, 3, 4];

export const SETUP_HINT_BUDGETS: readonly HintsBudget[] = [1, 2, 3];

/** Подсказка «Случайный игрок». 0 — отключить эту подсказку при включённых подсказках в целом. */
export const SETUP_RANDOM_PLAYER_HINT_BUDGETS: readonly (0 | 1 | 2 | 3 | 11)[] = [0, 1, 2, 3, 11];

/** Подписи для результата и совместимости; в настройках используется группировка (см. SETUP_MODE_GROUPS). */
export const SETUP_MODE_OPTIONS: ReadonlyArray<{ mode: GameMode; label: string }> = [
  { mode: 'nationalTop15', label: 'Сборные · ТОП-15' },
  { mode: 'nationalTop30', label: 'Сборные · ТОП-30' },
  { mode: 'clubs', label: 'Клубы · Европа' },
  { mode: 'rpl', label: 'Клубы · РПЛ' },
  { mode: 'chaos', label: 'Хаос' },
];

/** Верхний уровень выбора режима игры в настройках. */
export type SetupModeGroupId = 'nations' | 'clubs' | 'chaos'

export function getSetupModeGroupId(mode: GameMode): SetupModeGroupId {
  if (mode === 'nationalTop15' || mode === 'nationalTop30') return 'nations'
  if (mode === 'clubs' || mode === 'rpl') return 'clubs'
  return 'chaos'
}

/** Пояснение к выбранной группе (показывается только для активной). */
export const SETUP_MODE_GROUP_DESCRIPTIONS: Record<SetupModeGroupId, string> = {
  nations:
    'Сборные: в каждом раунде жеребьёвкой выпадает страна из списка (ТОП-15 или ТОП-30). Игроки набираются из пула этой сборной. Подрежим задаёт размер списка стран и состав запасных в подсказках.',
  clubs:
    'Клубы: в каждом раунде выпадает клуб — либо из европейского топа, либо из РПЛ. Игроки выбираются из состава этого клуба.',
  chaos:
    'Хаос: тип источника в раундах меняется — могут выпадать сборные, европейские клубы или РПЛ. Сочетает правила разных режимов в одной партии',
}

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
