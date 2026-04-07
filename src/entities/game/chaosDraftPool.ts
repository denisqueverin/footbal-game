import { RPL_CLUBS } from './rplClubs'
import { TOP_50_EURO_CLUBS } from './topClubs'
import { TOP_30_FOOTBALL_COUNTRIES_RU } from './topCountries'
import type { DraftSourceKind } from './types'

export type ChaosDraftToken = { label: string; kind: DraftSourceKind }

const TOP_30_LABEL_SET = new Set<string>(TOP_30_FOOTBALL_COUNTRIES_RU)
const RPL_LABEL_SET = new Set<string>(RPL_CLUBS)

/**
 * Все сборные (ТОП-30) + все клубы из европейского пула + все клубы РПЛ.
 * Совпадений по строкам между списками нет.
 */
export function buildChaosDraftPool(): ChaosDraftToken[] {
  return [
    ...TOP_30_FOOTBALL_COUNTRIES_RU.map((label) => ({ label, kind: 'national' as const })),
    ...TOP_50_EURO_CLUBS.map((label) => ({ label, kind: 'club' as const })),
    ...RPL_CLUBS.map((label) => ({ label, kind: 'rplClub' as const })),
  ]
}

/** Для отображения флагов/подсказок по сохранённой метке источника (режим «Хаос»). */
export function inferChaosSourceKind(label: string | null | undefined): DraftSourceKind | null {
  if (label == null || typeof label !== 'string' || !label.trim()) {
    return null
  }
  const key = label.trim()
  if (TOP_30_LABEL_SET.has(key)) return 'national'
  if (RPL_LABEL_SET.has(key)) return 'rplClub'
  return 'club'
}
