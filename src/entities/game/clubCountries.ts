import { getCountryFlagUrlRu } from './topCountries'

/**
 * Страна (как в интерфейсе) для каждого клуба из драфта.
 * Ключ — точное имя из TOP_50_EURO_CLUBS.
 */
export const CLUB_TO_COUNTRY_RU: Record<string, string> = {
  Arsenal: 'Англия',
  'Atlético Madrid': 'Испания',
  Ajax: 'Нидерланды',
  Barcelona: 'Испания',
  'Bayer Leverkusen': 'Германия',
  'Bayern Munich': 'Германия',
  'Borussia Dortmund': 'Германия',
  Chelsea: 'Англия',
  'CSKA Moscow': 'Россия',
  Internazionale: 'Италия',
  Juventus: 'Италия',
  Liverpool: 'Англия',
  'Lokomotiv Moscow': 'Россия',
  Lyon: 'Франция',
  'Manchester City': 'Англия',
  'Manchester United': 'Англия',
  Marseille: 'Франция',
  'AC Milan': 'Италия',
  'AS Monaco': 'Франция',
  Napoli: 'Италия',
  'Paris Saint-Germain': 'Франция',
  'FC Porto': 'Португалия',
  'PSV Eindhoven': 'Нидерланды',
  'Real Madrid': 'Испания',
  'AS Roma': 'Италия',
  'Rubin Kazan': 'Россия',
  'Schalke 04': 'Германия',
  Sevilla: 'Испания',
  'Spartak Moscow': 'Россия',
  'Tottenham Hotspur': 'Англия',
  'VfL Wolfsburg': 'Германия',
  'Werder Bremen': 'Германия',
  'Zenit Saint Petersburg': 'Россия',
  Valencia: 'Испания',
  'Leicester City': 'Англия',
  Galatasaray: 'Турция',
  'Fenerbahçe': 'Турция',
}

export function getClubCountryRu(club: string | null | undefined): string | null {
  if (!club) return null
  const key = club.trim()
  return CLUB_TO_COUNTRY_RU[key] ?? null
}

/** Флаг страны клуба — те же файлы `/flags/{iso}.png`, что и для национального режима. */
export function getClubFlagUrl(club: string | null | undefined): string | null {
  const ru = getClubCountryRu(club)
  if (!ru) return null
  return getCountryFlagUrlRu(ru)
}
