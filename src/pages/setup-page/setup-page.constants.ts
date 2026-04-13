import { SETUP_COLOR_SCHEME_PICKS } from '@/entities/game/core/colorSchemes';
import type { GameMode, HintsBudget, TeamCount } from '@/entities/game/core/types';

export const SETUP_TEAM_COUNTS: readonly TeamCount[] = [1, 2, 3, 4];

export const SETUP_HINT_BUDGETS: readonly HintsBudget[] = [1, 2, 3];

/** Подсказка «Случайный игрок» (в обычном UI: только 1–3). */
export const SETUP_RANDOM_PLAYER_HINT_BUDGETS: readonly (1 | 2 | 3)[] = [1, 2, 3];

/** Пароль для режима разработки в настройках. */
export const DEV_MODE_PASSWORD = '1234';

/** Подписи для результата и совместимости; в настройках используется группировка (см. SETUP_MODE_GROUPS). */
export const SETUP_MODE_OPTIONS: ReadonlyArray<{ mode: GameMode; label: string }> = [
  { mode: 'nationalTop15', label: 'Сборные · ТОП-15' },
  { mode: 'nationalTop30', label: 'Сборные · ТОП-30' },
  { mode: 'clubs', label: 'Клубы · Европа' },
  { mode: 'rpl', label: 'Клубы · РПЛ' },
  { mode: 'chaos', label: 'Хаос' },
];

/** Верхний уровень выбора режима игры в настройках. */
export type SetupModeGroupId = 'nations' | 'clubs' | 'chaos';

export function getSetupModeGroupId(mode: GameMode): SetupModeGroupId {
  if (mode === 'nationalTop15' || mode === 'nationalTop30') return 'nations';
  if (mode === 'clubs' || mode === 'rpl') return 'clubs';
  return 'chaos';
}

/** Пояснение к выбранной группе (показывается только для активной). */
export const SETUP_MODE_GROUP_DESCRIPTIONS: Record<SetupModeGroupId, string> = {
  nations:
    'Сборные: в каждом раунде жеребьёвкой выпадает страна из списка (ТОП-15 или ТОП-30). Игроки набираются из пула этой сборной. Подрежим задаёт размер списка стран.',
  clubs:
    'Клубы: в каждом раунде выпадает клуб — либо из европейского топа, либо из РПЛ. Игроки выбираются из состава этого клуба.',
  chaos:
    'Хаос: тип источника в раундах меняется — могут выпадать сборные, европейские клубы или РПЛ. Сочетает правила разных режимов в одной партии',
};

export const SETUP_SCHEME_OPTIONS = SETUP_COLOR_SCHEME_PICKS;
