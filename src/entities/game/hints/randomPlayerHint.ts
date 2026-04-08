import type { GameState, TeamId } from '../core/types'
import { drawRandom } from '../core/random'
import { NATIONAL_TOP15_RANDOM_PLAYERS, type Top15RandomPosition } from './nationalTop15RandomPlayers'
import { NATIONAL_TOP30_RANDOM_PLAYERS } from './nationalTop30RandomPlayers'
import { RPL_RANDOM_PLAYERS } from './rplRandomPlayers'
import { EURO_CLUBS_RANDOM_PLAYERS } from './euroClubsRandomPlayers'

function normalizeSpaces(s: string): string {
  return s.trim().replace(/\s+/g, ' ')
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
}): { playerName: string } | null {
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
    const k = nameMatchKey(item)
    if (!k) continue
    if (args.usedNameKeys.has(k)) {
      continue
    }
    return { playerName: item }
  }

  return null
}

export function pickRandomTop30Player(args: {
  country: string
  position: string
  usedNameKeys: Set<string>
  rng?: () => number
}): { playerName: string } | null {
  const pool = NATIONAL_TOP30_RANDOM_PLAYERS[args.country]
  if (!pool) return null
  const pos = args.position as Top15RandomPosition
  const candidates = pool[pos]
  if (!candidates || candidates.length === 0) return null

  let remaining = [...candidates]
  while (remaining.length > 0) {
    const { item, rest } = drawRandom(remaining, args.rng)
    remaining = rest
    const k = nameMatchKey(item)
    if (!k) continue
    if (args.usedNameKeys.has(k)) continue
    return { playerName: item }
  }

  return null
}

export function pickRandomRplPlayer(args: {
  club: string
  position: string
  usedNameKeys: Set<string>
  rng?: () => number
}): { playerName: string } | null {
  const pool = RPL_RANDOM_PLAYERS[args.club]
  if (!pool) return null
  const pos = args.position as Top15RandomPosition
  const candidates = pool[pos]
  if (!candidates || candidates.length === 0) return null

  let remaining = [...candidates]
  while (remaining.length > 0) {
    const { item, rest } = drawRandom(remaining, args.rng)
    remaining = rest
    const k = nameMatchKey(item)
    if (!k) continue
    if (args.usedNameKeys.has(k)) continue
    return { playerName: item }
  }

  return null
}

export function pickRandomEuroClubPlayer(args: {
  club: string
  position: string
  usedNameKeys: Set<string>
  rng?: () => number
}): { playerName: string } | null {
  const pool = EURO_CLUBS_RANDOM_PLAYERS[args.club]
  if (!pool) return null
  const pos = args.position as Top15RandomPosition
  const candidates = pool[pos]
  if (!candidates || candidates.length === 0) return null

  let remaining = [...candidates]
  while (remaining.length > 0) {
    const { item, rest } = drawRandom(remaining, args.rng)
    remaining = rest
    const k = nameMatchKey(item)
    if (!k) continue
    if (args.usedNameKeys.has(k)) continue
    return { playerName: item }
  }

  return null
}

export function createTeamNumberRecord<T>(value: T): Record<TeamId, T> {
  return { team1: value, team2: value, team3: value, team4: value }
}

