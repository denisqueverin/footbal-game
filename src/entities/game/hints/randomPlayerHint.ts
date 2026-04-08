import type { GameState, TeamId } from '../core/types'
import { drawRandom } from '../core/random'
import {
  NATIONAL_TOP15_RANDOM_PLAYERS,
  type PlayerStars,
  type RandomPlayerCandidate,
  type Top15RandomPosition,
} from './nationalTop15RandomPlayers'
import { NATIONAL_TOP30_RANDOM_PLAYERS } from './nationalTop30RandomPlayers'
import { RPL_PLAYER_STARS, RPL_RANDOM_PLAYERS } from './rplRandomPlayers'
import { EURO_CLUBS_PLAYER_STARS, EURO_CLUBS_RANDOM_PLAYERS } from './euroClubsRandomPlayers'

function normalizeSpaces(s: string): string {
  return s.trim().replace(/\s+/g, ' ')
}

type BestPick = { playerName: string; stars: PlayerStars }

function normalizeCandidate(
  item: string | RandomPlayerCandidate,
  starsOverride: PlayerStars | null,
): RandomPlayerCandidate {
  if (typeof item === 'string') {
    return { playerName: item, stars: starsOverride ?? 3 }
  }
  return item
}

function countAvailableFromCandidates(args: {
  candidates: readonly (string | RandomPlayerCandidate)[]
  usedNameKeys: Set<string>
  starsForName?: (name: string) => PlayerStars | null
}): number {
  return args.candidates
    .map((x) => {
      const starsOverride = typeof x === 'string' ? (args.starsForName?.(x) ?? null) : null
      return normalizeCandidate(x, starsOverride)
    })
    .map((c) => ({ ...c, playerName: normalizeSpaces(c.playerName) }))
    .filter((c) => c.playerName.length > 0)
    .filter((c) => {
      const k = nameMatchKey(c.playerName)
      return Boolean(k) && !args.usedNameKeys.has(k)
    }).length
}

function pickBestFromCandidates(args: {
  candidates: readonly (string | RandomPlayerCandidate)[]
  usedNameKeys: Set<string>
  rng?: () => number
  starsForName?: (name: string) => PlayerStars | null
}): BestPick | null {
  const pool = args.candidates
    .map((x) => {
      const starsOverride = typeof x === 'string' ? (args.starsForName?.(x) ?? null) : null
      return normalizeCandidate(x, starsOverride)
    })
    .map((c) => ({ ...c, playerName: normalizeSpaces(c.playerName) }))
    .filter((c) => c.playerName.length > 0)
    .filter((c) => {
      const k = nameMatchKey(c.playerName)
      return Boolean(k) && !args.usedNameKeys.has(k)
    })

  if (pool.length === 0) return null

  const maxStars = pool.reduce((m, c) => (c.stars > m ? c.stars : m), pool[0]!.stars)
  const best = pool.filter((c) => c.stars === maxStars)
  const { item } = drawRandom(best, args.rng)
  return { playerName: item.playerName, stars: item.stars }
}

/**
 * Правило совпадения имён для исключения дублей между командами.
 * - 1 слово: это слово
 * - 2 слова: второе слово
 * - 3+ слов: второе + третье
 * Без учёта регистра.
 */
export function nameMatchKey(fullName: string): string {
  const cleaned = normalizeSpaces(fullName).toLowerCase()
  if (!cleaned) return ''
  const parts = cleaned.split(' ')
  if (parts.length === 1) return parts[0]!
  if (parts.length === 2) return parts[1]!
  return `${parts[1]!} ${parts[2]!}`
}

export function existingNameKeys(state: GameState): Set<string> {
  const keys = new Set<string>()
  for (const teamId of state.teamOrder) {
    const team = state.teams[teamId]
    for (const pick of Object.values(team.picksBySlotId)) {
      if (!pick.playerName) continue
      const k = nameMatchKey(pick.playerName)
      if (k) keys.add(k)
    }
  }
  return keys
}

export function pickRandomTop15Player(args: {
  country: string
  position: string
  usedNameKeys: Set<string>
  rng?: () => number
}): { playerName: string; stars: PlayerStars } | null {
  const pool = NATIONAL_TOP15_RANDOM_PLAYERS[args.country]
  if (!pool) return null
  const pos = args.position as Top15RandomPosition
  const candidates = pool[pos]
  if (!candidates || candidates.length === 0) return null

  // фильтруем по совпадениям
  let remaining = [...candidates]
  while (remaining.length > 0) {
    const { item, rest } = drawRandom(remaining, args.rng)
    remaining = rest
    const normalized: RandomPlayerCandidate =
      typeof item === 'string' ? { playerName: item, stars: 3 } : item
    const k = nameMatchKey(normalized.playerName)
    if (!k) continue
    if (args.usedNameKeys.has(k)) {
      continue
    }
    return { playerName: normalized.playerName, stars: normalized.stars }
  }

  return null
}

export function pickRandomTop30Player(args: {
  country: string
  position: string
  usedNameKeys: Set<string>
  rng?: () => number
}): { playerName: string; stars: PlayerStars } | null {
  const pool = NATIONAL_TOP30_RANDOM_PLAYERS[args.country]
  if (!pool) return null
  const pos = args.position as Top15RandomPosition
  const candidates = pool[pos]
  if (!candidates || candidates.length === 0) return null

  let remaining = [...candidates]
  while (remaining.length > 0) {
    const { item, rest } = drawRandom(remaining, args.rng)
    remaining = rest
    const normalized: RandomPlayerCandidate =
      typeof item === 'string' ? { playerName: item, stars: 3 } : item
    const k = nameMatchKey(normalized.playerName)
    if (!k) continue
    if (args.usedNameKeys.has(k)) continue
    return { playerName: normalized.playerName, stars: normalized.stars }
  }

  return null
}

export function pickRandomRplPlayer(args: {
  club: string
  position: string
  usedNameKeys: Set<string>
  rng?: () => number
}): { playerName: string; stars: PlayerStars } | null {
  const pool = RPL_RANDOM_PLAYERS[args.club]
  if (!pool) return null
  const pos = args.position as Top15RandomPosition
  const candidates = pool[pos]
  if (!candidates || candidates.length === 0) return null

  let remaining = [...candidates]
  while (remaining.length > 0) {
    const { item, rest } = drawRandom(remaining, args.rng)
    remaining = rest
    const normalized: RandomPlayerCandidate =
      typeof item === 'string'
        ? { playerName: item, stars: RPL_PLAYER_STARS[args.club]?.[item] ?? 3 }
        : (item as RandomPlayerCandidate)
    const k = nameMatchKey(normalized.playerName)
    if (!k) continue
    if (args.usedNameKeys.has(k)) continue
    return { playerName: normalized.playerName, stars: normalized.stars }
  }

  return null
}

export function pickRandomEuroClubPlayer(args: {
  club: string
  position: string
  usedNameKeys: Set<string>
  rng?: () => number
}): { playerName: string; stars: PlayerStars } | null {
  const pool = EURO_CLUBS_RANDOM_PLAYERS[args.club]
  if (!pool) return null
  const pos = args.position as Top15RandomPosition
  const candidates = pool[pos]
  if (!candidates || candidates.length === 0) return null

  let remaining = [...candidates]
  while (remaining.length > 0) {
    const { item, rest } = drawRandom(remaining, args.rng)
    remaining = rest
    const normalized: RandomPlayerCandidate =
      typeof item === 'string'
        ? { playerName: item, stars: EURO_CLUBS_PLAYER_STARS[args.club]?.[item] ?? 3 }
        : (item as RandomPlayerCandidate)
    const k = nameMatchKey(normalized.playerName)
    if (!k) continue
    if (args.usedNameKeys.has(k)) continue
    return { playerName: normalized.playerName, stars: normalized.stars }
  }

  return null
}

function pickRandomAnyOutfieldFromPool(args: {
  pool: Partial<Record<Top15RandomPosition, readonly (string | RandomPlayerCandidate)[]>>
  usedNameKeys: Set<string>
  rng?: () => number
}): { playerName: string; stars: PlayerStars } | null {
  // собираем всех полевых (кроме GK)
  const positions = Object.keys(args.pool) as Top15RandomPosition[]
  const outfield = positions
    .filter((p) => p !== 'GK')
    .flatMap((p) => [...(args.pool[p] ?? [])])
    .map((x) => (typeof x === 'string' ? ({ playerName: x, stars: 3 } as RandomPlayerCandidate) : x))
    .filter((p) => p.playerName.trim().length > 0)

  if (outfield.length === 0) return null

  let remaining = [...outfield]
  while (remaining.length > 0) {
    const { item, rest } = drawRandom(remaining, args.rng)
    remaining = rest
    const k = nameMatchKey(item.playerName)
    if (!k) continue
    if (args.usedNameKeys.has(k)) continue
    return { playerName: item.playerName, stars: item.stars }
  }

  return null
}

export function pickRandomAnyTop15OutfieldPlayer(args: {
  country: string
  usedNameKeys: Set<string>
  rng?: () => number
}): { playerName: string; stars: PlayerStars } | null {
  const pool = NATIONAL_TOP15_RANDOM_PLAYERS[args.country]
  if (!pool) return null
  return pickRandomAnyOutfieldFromPool({ pool, usedNameKeys: args.usedNameKeys, rng: args.rng })
}

export function pickRandomAnyTop30OutfieldPlayer(args: {
  country: string
  usedNameKeys: Set<string>
  rng?: () => number
}): { playerName: string; stars: PlayerStars } | null {
  const pool = NATIONAL_TOP30_RANDOM_PLAYERS[args.country]
  if (!pool) return null
  return pickRandomAnyOutfieldFromPool({ pool, usedNameKeys: args.usedNameKeys, rng: args.rng })
}

export function pickRandomAnyRplOutfieldPlayer(args: {
  club: string
  usedNameKeys: Set<string>
  rng?: () => number
}): { playerName: string; stars: PlayerStars } | null {
  const pool = RPL_RANDOM_PLAYERS[args.club]
  if (!pool) return null
  const picked = pickRandomAnyOutfieldFromPool({ pool, usedNameKeys: args.usedNameKeys, rng: args.rng })
  if (!picked) return null
  const stars = RPL_PLAYER_STARS[args.club]?.[picked.playerName] ?? picked.stars
  return { playerName: picked.playerName, stars }
}

export function pickRandomAnyEuroClubOutfieldPlayer(args: {
  club: string
  usedNameKeys: Set<string>
  rng?: () => number
}): { playerName: string; stars: PlayerStars } | null {
  const pool = EURO_CLUBS_RANDOM_PLAYERS[args.club]
  if (!pool) return null
  const picked = pickRandomAnyOutfieldFromPool({ pool, usedNameKeys: args.usedNameKeys, rng: args.rng })
  if (!picked) return null
  const stars = EURO_CLUBS_PLAYER_STARS[args.club]?.[picked.playerName] ?? picked.stars
  return { playerName: picked.playerName, stars }
}

export function pickBestTop15Player(args: {
  country: string
  position: string
  usedNameKeys: Set<string>
  rng?: () => number
}): BestPick | null {
  const pool = NATIONAL_TOP15_RANDOM_PLAYERS[args.country]
  if (!pool) return null
  const pos = args.position as Top15RandomPosition
  const candidates = pool[pos]
  if (!candidates || candidates.length === 0) return null
  return pickBestFromCandidates({ candidates, usedNameKeys: args.usedNameKeys, rng: args.rng })
}

export function countAvailableTop15Players(args: {
  country: string
  position: string
  usedNameKeys: Set<string>
}): number {
  const pool = NATIONAL_TOP15_RANDOM_PLAYERS[args.country]
  if (!pool) return 0
  const pos = args.position as Top15RandomPosition
  const candidates = pool[pos]
  if (!candidates || candidates.length === 0) return 0
  return countAvailableFromCandidates({ candidates, usedNameKeys: args.usedNameKeys })
}

export function pickBestTop30Player(args: {
  country: string
  position: string
  usedNameKeys: Set<string>
  rng?: () => number
}): BestPick | null {
  const pool = NATIONAL_TOP30_RANDOM_PLAYERS[args.country]
  if (!pool) return null
  const pos = args.position as Top15RandomPosition
  const candidates = pool[pos]
  if (!candidates || candidates.length === 0) return null
  return pickBestFromCandidates({ candidates, usedNameKeys: args.usedNameKeys, rng: args.rng })
}

export function countAvailableTop30Players(args: {
  country: string
  position: string
  usedNameKeys: Set<string>
}): number {
  const pool = NATIONAL_TOP30_RANDOM_PLAYERS[args.country]
  if (!pool) return 0
  const pos = args.position as Top15RandomPosition
  const candidates = pool[pos]
  if (!candidates || candidates.length === 0) return 0
  return countAvailableFromCandidates({ candidates, usedNameKeys: args.usedNameKeys })
}

export function pickBestRplPlayer(args: {
  club: string
  position: string
  usedNameKeys: Set<string>
  rng?: () => number
}): BestPick | null {
  const pool = RPL_RANDOM_PLAYERS[args.club]
  if (!pool) return null
  const pos = args.position as Top15RandomPosition
  const candidates = pool[pos]
  if (!candidates || candidates.length === 0) return null
  return pickBestFromCandidates({
    candidates,
    usedNameKeys: args.usedNameKeys,
    rng: args.rng,
    starsForName: (name) => RPL_PLAYER_STARS[args.club]?.[name] ?? null,
  })
}

export function countAvailableRplPlayers(args: {
  club: string
  position: string
  usedNameKeys: Set<string>
}): number {
  const pool = RPL_RANDOM_PLAYERS[args.club]
  if (!pool) return 0
  const pos = args.position as Top15RandomPosition
  const candidates = pool[pos]
  if (!candidates || candidates.length === 0) return 0
  return countAvailableFromCandidates({
    candidates,
    usedNameKeys: args.usedNameKeys,
    starsForName: (name) => RPL_PLAYER_STARS[args.club]?.[name] ?? null,
  })
}

export function pickBestEuroClubPlayer(args: {
  club: string
  position: string
  usedNameKeys: Set<string>
  rng?: () => number
}): BestPick | null {
  const pool = EURO_CLUBS_RANDOM_PLAYERS[args.club]
  if (!pool) return null
  const pos = args.position as Top15RandomPosition
  const candidates = pool[pos]
  if (!candidates || candidates.length === 0) return null
  return pickBestFromCandidates({
    candidates,
    usedNameKeys: args.usedNameKeys,
    rng: args.rng,
    starsForName: (name) => EURO_CLUBS_PLAYER_STARS[args.club]?.[name] ?? null,
  })
}

export function countAvailableEuroClubPlayers(args: {
  club: string
  position: string
  usedNameKeys: Set<string>
}): number {
  const pool = EURO_CLUBS_RANDOM_PLAYERS[args.club]
  if (!pool) return 0
  const pos = args.position as Top15RandomPosition
  const candidates = pool[pos]
  if (!candidates || candidates.length === 0) return 0
  return countAvailableFromCandidates({
    candidates,
    usedNameKeys: args.usedNameKeys,
    starsForName: (name) => EURO_CLUBS_PLAYER_STARS[args.club]?.[name] ?? null,
  })
}

function pickBestAnyOutfieldFromPool(args: {
  pool: Partial<Record<Top15RandomPosition, readonly (string | RandomPlayerCandidate)[]>>
  usedNameKeys: Set<string>
  rng?: () => number
  starsForName?: (name: string) => PlayerStars | null
}): BestPick | null {
  const positions = Object.keys(args.pool) as Top15RandomPosition[]
  const outfield = positions
    .filter((p) => p !== 'GK')
    .flatMap((p) => [...(args.pool[p] ?? [])])
  if (outfield.length === 0) return null
  return pickBestFromCandidates({
    candidates: outfield,
    usedNameKeys: args.usedNameKeys,
    rng: args.rng,
    starsForName: args.starsForName,
  })
}

function countAvailableAnyOutfieldFromPool(args: {
  pool: Partial<Record<Top15RandomPosition, readonly (string | RandomPlayerCandidate)[]>>
  usedNameKeys: Set<string>
  starsForName?: (name: string) => PlayerStars | null
}): number {
  const positions = Object.keys(args.pool) as Top15RandomPosition[]
  const outfield = positions
    .filter((p) => p !== 'GK')
    .flatMap((p) => [...(args.pool[p] ?? [])])
  if (outfield.length === 0) return 0
  return countAvailableFromCandidates({
    candidates: outfield,
    usedNameKeys: args.usedNameKeys,
    starsForName: args.starsForName,
  })
}

export function pickBestAnyTop15OutfieldPlayer(args: {
  country: string
  usedNameKeys: Set<string>
  rng?: () => number
}): BestPick | null {
  const pool = NATIONAL_TOP15_RANDOM_PLAYERS[args.country]
  if (!pool) return null
  return pickBestAnyOutfieldFromPool({ pool, usedNameKeys: args.usedNameKeys, rng: args.rng })
}

export function countAvailableAnyTop15OutfieldPlayers(args: {
  country: string
  usedNameKeys: Set<string>
}): number {
  const pool = NATIONAL_TOP15_RANDOM_PLAYERS[args.country]
  if (!pool) return 0
  return countAvailableAnyOutfieldFromPool({ pool, usedNameKeys: args.usedNameKeys })
}

export function pickBestAnyTop30OutfieldPlayer(args: {
  country: string
  usedNameKeys: Set<string>
  rng?: () => number
}): BestPick | null {
  const pool = NATIONAL_TOP30_RANDOM_PLAYERS[args.country]
  if (!pool) return null
  return pickBestAnyOutfieldFromPool({ pool, usedNameKeys: args.usedNameKeys, rng: args.rng })
}

export function countAvailableAnyTop30OutfieldPlayers(args: {
  country: string
  usedNameKeys: Set<string>
}): number {
  const pool = NATIONAL_TOP30_RANDOM_PLAYERS[args.country]
  if (!pool) return 0
  return countAvailableAnyOutfieldFromPool({ pool, usedNameKeys: args.usedNameKeys })
}

export function pickBestAnyRplOutfieldPlayer(args: {
  club: string
  usedNameKeys: Set<string>
  rng?: () => number
}): BestPick | null {
  const pool = RPL_RANDOM_PLAYERS[args.club]
  if (!pool) return null
  return pickBestAnyOutfieldFromPool({
    pool,
    usedNameKeys: args.usedNameKeys,
    rng: args.rng,
    starsForName: (name) => RPL_PLAYER_STARS[args.club]?.[name] ?? null,
  })
}

export function countAvailableAnyRplOutfieldPlayers(args: {
  club: string
  usedNameKeys: Set<string>
}): number {
  const pool = RPL_RANDOM_PLAYERS[args.club]
  if (!pool) return 0
  return countAvailableAnyOutfieldFromPool({
    pool,
    usedNameKeys: args.usedNameKeys,
    starsForName: (name) => RPL_PLAYER_STARS[args.club]?.[name] ?? null,
  })
}

export function pickBestAnyEuroClubOutfieldPlayer(args: {
  club: string
  usedNameKeys: Set<string>
  rng?: () => number
}): BestPick | null {
  const pool = EURO_CLUBS_RANDOM_PLAYERS[args.club]
  if (!pool) return null
  return pickBestAnyOutfieldFromPool({
    pool,
    usedNameKeys: args.usedNameKeys,
    rng: args.rng,
    starsForName: (name) => EURO_CLUBS_PLAYER_STARS[args.club]?.[name] ?? null,
  })
}

export function countAvailableAnyEuroClubOutfieldPlayers(args: {
  club: string
  usedNameKeys: Set<string>
}): number {
  const pool = EURO_CLUBS_RANDOM_PLAYERS[args.club]
  if (!pool) return 0
  return countAvailableAnyOutfieldFromPool({
    pool,
    usedNameKeys: args.usedNameKeys,
    starsForName: (name) => EURO_CLUBS_PLAYER_STARS[args.club]?.[name] ?? null,
  })
}

export function createTeamNumberRecord<T>(value: T): Record<TeamId, T> {
  return { team1: value, team2: value, team3: value, team4: value }
}

