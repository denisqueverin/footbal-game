import { drawRandom } from '../core/random'
import type { PlayerStars, Top15RandomPosition } from './nationalTop15RandomPlayers'
import { NATIONAL_TOP15_RANDOM_PLAYERS } from './nationalTop15RandomPlayers'
import { NATIONAL_TOP30_RANDOM_PLAYERS } from './nationalTop30RandomPlayers'
import { EURO_CLUBS_PLAYER_STARS, EURO_CLUBS_RANDOM_PLAYERS } from './euroClubsRandomPlayers'
import { RPL_PLAYER_STARS, RPL_RANDOM_PLAYERS } from './rplRandomPlayers'
import { isDraftedPlayerNameTaken } from './randomPlayerHint'

type Cand = { playerName: string; stars: PlayerStars }

const POSITION_KEYS: Top15RandomPosition[] = [
  'GK',
  'RB',
  'CB',
  'LB',
  'CDM',
  'CAM',
  'CM',
  'RM',
  'LM',
  'RW',
  'LW',
  'ST',
]

function bump(byPos: Map<string, Map<string, number>>, pos: string, rawName: string, stars: number): void {
  const name = rawName.trim().replace(/\s+/g, ' ')
  if (!name.length) return
  const s = Math.min(5, Math.max(1, Math.round(stars))) as PlayerStars
  if (!byPos.has(pos)) byPos.set(pos, new Map())
  const m = byPos.get(pos)!
  const prev = m.get(name) ?? 0
  if (s > prev) m.set(name, s)
}

function ingestNational(
  byPos: Map<string, Map<string, number>>,
  data: Record<string, Partial<Record<Top15RandomPosition, readonly unknown[]>>>,
): void {
  for (const country of Object.keys(data)) {
    const pool = data[country]
    if (!pool) continue
    for (const pos of POSITION_KEYS) {
      const arr = pool[pos]
      if (!arr || arr.length === 0) continue
      for (const item of arr) {
        if (typeof item === 'string') {
          bump(byPos, pos, item, 3)
        } else if (item && typeof item === 'object' && 'playerName' in item) {
          const c = item as { playerName: string; stars: PlayerStars }
          bump(byPos, pos, c.playerName, c.stars)
        }
      }
    }
  }
}

function ingestRpl(byPos: Map<string, Map<string, number>>): void {
  for (const club of Object.keys(RPL_RANDOM_PLAYERS)) {
    const pool = RPL_RANDOM_PLAYERS[club]
    const starsTable = RPL_PLAYER_STARS[club]
    if (!pool) continue
    for (const pos of POSITION_KEYS) {
      const arr = pool[pos]
      if (!arr || arr.length === 0) continue
      for (const item of arr) {
        if (typeof item === 'string') {
          bump(byPos, pos, item, starsTable?.[item] ?? 3)
        } else if (item && typeof item === 'object' && 'playerName' in item) {
          const c = item as { playerName: string; stars?: PlayerStars }
          bump(byPos, pos, c.playerName, c.stars ?? starsTable?.[c.playerName] ?? 3)
        }
      }
    }
  }
}

function ingestEuro(byPos: Map<string, Map<string, number>>): void {
  for (const club of Object.keys(EURO_CLUBS_RANDOM_PLAYERS)) {
    const pool = EURO_CLUBS_RANDOM_PLAYERS[club]
    const starsTable = EURO_CLUBS_PLAYER_STARS[club]
    if (!pool) continue
    for (const pos of POSITION_KEYS) {
      const arr = pool[pos]
      if (!arr || arr.length === 0) continue
      for (const item of arr) {
        if (typeof item === 'string') {
          bump(byPos, pos, item, starsTable?.[item] ?? 3)
        } else if (item && typeof item === 'object' && 'playerName' in item) {
          const c = item as { playerName: string; stars?: PlayerStars }
          bump(byPos, pos, c.playerName, c.stars ?? starsTable?.[c.playerName] ?? 3)
        }
      }
    }
  }
}

function buildByPosition(): Record<Top15RandomPosition, Cand[]> {
  const byPos = new Map<string, Map<string, number>>()
  ingestNational(byPos, NATIONAL_TOP15_RANDOM_PLAYERS)
  ingestNational(byPos, NATIONAL_TOP30_RANDOM_PLAYERS)
  ingestRpl(byPos)
  ingestEuro(byPos)

  const out = {} as Record<Top15RandomPosition, Cand[]>
  for (const pos of POSITION_KEYS) {
    const m = byPos.get(pos)
    out[pos] = m
      ? Array.from(m.entries()).map(([playerName, stars]) => ({ playerName, stars: stars as PlayerStars }))
      : []
  }
  return out
}

export const UNFAIR_CPU_POOL_BY_POSITION = buildByPosition()

function buildFlatMaxStars(): Cand[] {
  const byName = new Map<string, number>()
  for (const pos of POSITION_KEYS) {
    for (const c of UNFAIR_CPU_POOL_BY_POSITION[pos] ?? []) {
      const prev = byName.get(c.playerName) ?? 0
      if (c.stars > prev) byName.set(c.playerName, c.stars)
    }
  }
  return Array.from(byName.entries()).map(([playerName, stars]) => ({
    playerName,
    stars: stars as PlayerStars,
  }))
}

const UNFAIR_FLAT_MAX_STARS = buildFlatMaxStars()

/** Как в GamePage: подбор позиций в пуле для ярлыка слота схемы. */
export function unfairPositionSearchOrder(slotLabel: string): string[] {
  switch (slotLabel) {
    case 'RAM':
      return [...new Set(['RAM', 'RM', 'RW', 'CAM', 'CM'])]
    case 'LAM':
      return [...new Set(['LAM', 'LM', 'LW', 'CAM', 'CM'])]
    case 'RWB':
      return [...new Set(['RWB', 'RB', 'RM'])]
    case 'LWB':
      return [...new Set(['LWB', 'LB', 'LM'])]
    default:
      return [slotLabel]
  }
}

/**
 * Сильнейший доступный игрок под слот (объединённый пул ТОП-15/30, РПЛ, европейские клубы).
 * usedPlayerNames — уже занятые имена в матче (в т.ч. у людей), без повторов.
 */
export function pickBestUnfairCpuPlayer(args: {
  slotLabel: string
  usedPlayerNames: readonly string[]
  rng?: () => number
}): Cand | null {
  const labels = unfairPositionSearchOrder(args.slotLabel)
  const seen = new Set<string>()
  const pool: Cand[] = []
  for (const pos of labels) {
    const arr = UNFAIR_CPU_POOL_BY_POSITION[pos as Top15RandomPosition]
    if (!arr || arr.length === 0) continue
    for (const c of arr) {
      const key = c.playerName.toLowerCase().trim()
      if (seen.has(key)) continue
      if (isDraftedPlayerNameTaken(c.playerName, args.usedPlayerNames)) continue
      seen.add(key)
      pool.push(c)
    }
  }

  if (pool.length === 0) return null
  const maxStars = pool.reduce((m, c) => (c.stars > m ? c.stars : m), pool[0]!.stars)
  const top = pool.filter((c) => c.stars === maxStars)
  const { item } = drawRandom(top, args.rng)
  return item
}

/** Любая свободная позиция — если под конкретный слот никого не осталось. */
export function pickBestUnfairCpuAnyPosition(args: {
  usedPlayerNames: readonly string[]
  rng?: () => number
}): Cand | null {
  const pool = UNFAIR_FLAT_MAX_STARS.filter(
    (c) => !isDraftedPlayerNameTaken(c.playerName, args.usedPlayerNames),
  )
  if (pool.length === 0) return null
  const maxStars = pool.reduce((m, c) => (c.stars > m ? c.stars : m), pool[0]!.stars)
  const top = pool.filter((c) => c.stars === maxStars)
  const { item } = drawRandom(top, args.rng)
  return item
}

/** Абсолютный запасной вариант (допускает совпадение с уже взятыми — только если пул исчерпан). */
export function pickUnfairCpuDupOk(rng?: () => number): Cand | null {
  if (UNFAIR_FLAT_MAX_STARS.length === 0) return null
  const maxStars = UNFAIR_FLAT_MAX_STARS.reduce((m, c) => (c.stars > m ? c.stars : m), UNFAIR_FLAT_MAX_STARS[0]!.stars)
  const top = UNFAIR_FLAT_MAX_STARS.filter((c) => c.stars === maxStars)
  const { item } = drawRandom(top, rng)
  return item
}
