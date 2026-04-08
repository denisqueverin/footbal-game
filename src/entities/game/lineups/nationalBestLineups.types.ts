import type { BestLineupLine } from './bestLineupTypes'

export type NationalLineupData = {
  countryRu: string
  start: readonly BestLineupLine[]
  bench: readonly BestLineupLine[]
}
