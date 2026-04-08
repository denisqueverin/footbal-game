import type { BestLineupLine } from './bestLineupTypes'

export const lineupLine = (role: string, ru: string, en: string): BestLineupLine => ({ role, ru, en })
