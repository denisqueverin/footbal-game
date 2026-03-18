export const TOP_30_FOOTBALL_COUNTRIES_RU = [
  'Аргентина',
  'Бразилия',
  'Франция',
  'Испания',
  'Англия',
  'Португалия',
  'Нидерланды',
  'Германия',
  'Италия',
  'Бельгия',
  'Хорватия',
  'Уругвай',
  'Колумбия',
  'Мексика',
  'США',
  'Швейцария',
  'Дания',
  'Швеция',
  'Норвегия',
  'Польша',
  'Сенегал',
  'Марокко',
  'Япония',
  'Южная Корея',
  'Иран',
  'Австралия',
  'Чили',
  'Эквадор',
  'Сербия',
  'Турция',
] as const

const ISO2_BY_COUNTRY_RU: Record<string, string> = {
  Аргентина: 'ar',
  Бразилия: 'br',
  Франция: 'fr',
  Испания: 'es',
  Англия: 'gb', // используем общий флаг Великобритании
  Португалия: 'pt',
  Нидерланды: 'nl',
  Германия: 'de',
  Италия: 'it',
  Бельгия: 'be',
  Хорватия: 'hr',
  Уругвай: 'uy',
  Колумбия: 'co',
  Мексика: 'mx',
  США: 'us',
  Швейцария: 'ch',
  Дания: 'dk',
  Швеция: 'se',
  Норвегия: 'no',
  Польша: 'pl',
  Сенегал: 'sn',
  Марокко: 'ma',
  Япония: 'jp',
  'Южная Корея': 'kr',
  Иран: 'ir',
  Австралия: 'au',
  Чили: 'cl',
  Эквадор: 'ec',
  Сербия: 'rs',
  Турция: 'tr',
}

// Флаги берём из локальной папки public/flags, чтобы не зависеть от внешних CDN
export function getCountryFlagUrlRu(country: string | null | undefined): string | null {
  if (!country) return null
  const key = country.trim()
  const iso2 = ISO2_BY_COUNTRY_RU[key]
  if (!iso2) return null
  return `/flags/${iso2}.png`
}

export function pickRandomUnique<T>(items: readonly T[], count: number): T[] {
  if (count < 0) throw new Error('count must be >= 0')
  if (count > items.length) throw new Error('count is larger than list length')
  const pool = [...items]
  const out: T[] = []
  while (out.length < count) {
    const idx = Math.floor(Math.random() * pool.length)
    out.push(pool[idx]!)
    pool.splice(idx, 1)
  }
  return out
}

