import type { NationalLineupData } from './nationalBestLineups.types'
import { NATIONAL_LINEUPS_PART1 } from './nationalBestLineups.part1'
import { NATIONAL_LINEUPS_PART2 } from './nationalBestLineups.part2'
import { NATIONAL_LINEUPS_PART3 } from './nationalBestLineups.part3'
import { NATIONAL_LINEUPS_PART4 } from './nationalBestLineups.part4'
import { NATIONAL_LINEUPS_PART5 } from './nationalBestLineups.part5'

export type { NationalLineupData } from './nationalBestLineups.types'

const NATIONAL_LINEUPS: Record<string, NationalLineupData> = {
  ...NATIONAL_LINEUPS_PART1,
  ...NATIONAL_LINEUPS_PART2,
  ...NATIONAL_LINEUPS_PART3,
  ...NATIONAL_LINEUPS_PART4,
  ...NATIONAL_LINEUPS_PART5,
}

/** Подсказка по сборной: ключ — точное имя страны из пула ТОП-15 / ТОП-30 / currentCountry. */
export function getNationalLineupForCountry(countryRu: string | null | undefined): NationalLineupData | null {
  if (countryRu == null || typeof countryRu !== 'string' || !countryRu.trim()) {
    return null
  }
  const key = countryRu.trim()
  const data = NATIONAL_LINEUPS[key]
  if (!data) {
    return { countryRu: key, start: [], bench: [] }
  }
  return data
}
