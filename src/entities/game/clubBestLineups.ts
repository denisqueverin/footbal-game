import type { BestLineupLine } from './bestLineupTypes'
import type { ClubLineupData } from './clubLineupTypes'
import { CLUB_LINEUPS_PART1 } from './clubBestLineups.part1'
import { CLUB_LINEUPS_PART2 } from './clubBestLineups.part2'
import { CLUB_LINEUPS_PART3 } from './clubBestLineups.part3'
import { CLUB_LINEUPS_PART4 } from './clubBestLineups.part4'
import { CLUB_LINEUPS_PART5 } from './clubBestLineups.part5'
import { RPL_CLUB_LINEUPS } from './rplClubLineups'
import type { GameMode } from './types'

export const CLUB_LINEUPS_FULL: Record<string, ClubLineupData> = {
  ...CLUB_LINEUPS_PART1,
  ...CLUB_LINEUPS_PART2,
  ...CLUB_LINEUPS_PART3,
  ...CLUB_LINEUPS_PART4,
  ...CLUB_LINEUPS_PART5,
}

/** Русское название клуба для заголовка (как в подсказке). */
export const CLUB_LINEUP_TITLE_RU: Partial<Record<string, string>> = {
  Arsenal: 'Арсенал',
  'Atlético Madrid': 'Атлетико Мадрид',
  Ajax: 'Аякс',
  Barcelona: 'Барселона',
  'Bayer Leverkusen': 'Байер 04',
  'Bayern Munich': 'Бавария',
  'Borussia Dortmund': 'Боруссия Дортмунд',
  Chelsea: 'Челси',
  'CSKA Moscow': 'ЦСКА Москва',
  Internazionale: 'Интернационале',
  Juventus: 'Ювентус',
  Liverpool: 'Ливерпуль',
  'Lokomotiv Moscow': 'Локомотив Москва',
  Lyon: 'Лион',
  'Manchester City': 'Манчестер Сити',
  'Manchester United': 'Манчестер Юнайтед',
  Marseille: 'Марсель',
  'AC Milan': 'Милан',
  'AS Monaco': 'Монако',
  Napoli: 'Наполи',
  'Paris Saint-Germain': 'Пари Сен-Жермен',
  'FC Porto': 'Порту',
  'PSV Eindhoven': 'ПСВ Эйндховен',
  'Real Madrid': 'Реал Мадрид',
  'AS Roma': 'Рома',
  'Rubin Kazan': 'Рубин Казань',
  'Schalke 04': 'Шальке 04',
  Sevilla: 'Севилья',
  'Spartak Moscow': 'Спартак Москва',
  'Tottenham Hotspur': 'Тоттенхэм Хотспур',
  Valencia: 'Валенсия',
  'VfL Wolfsburg': 'Вольфсбург',
  'Werder Bremen': 'Вердер Бремен',
  'Zenit Saint Petersburg': 'Зенит Санкт-Петербург',
  'Leicester City': 'Лестер Сити',
  Galatasaray: 'Галатасарай',
  'Fenerbahçe': 'Фенербахче',
}

export type ClubLineupSection = {
  club: string
  titleRu: string | null
  start: readonly BestLineupLine[]
  bench: readonly BestLineupLine[]
}

/** Подсказка «Лучший состав» — только для клуба текущего раунда (`currentCountry`). */
export function getLineupSectionForClub(
  club: string | null | undefined,
  mode?: GameMode,
): ClubLineupSection | null {
  if (club == null || typeof club !== 'string' || !club.trim()) {
    return null
  }
  const key = club.trim()
  const data =
    mode === 'rpl' ? RPL_CLUB_LINEUPS[key] ?? CLUB_LINEUPS_FULL[key] : CLUB_LINEUPS_FULL[key]
  return {
    club: key,
    titleRu: CLUB_LINEUP_TITLE_RU[key] ?? null,
    start: data?.start ?? [],
    bench: data?.bench ?? [],
  }
}
