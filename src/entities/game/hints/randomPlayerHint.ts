import type { GameMode, GameState, TeamId } from '../core/types'
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

/** Нижний регистр, схлопывание пробелов, дефисы как разделители слов. */
function normalizeComparableName(s: string): string {
  return normalizeSpaces(s)
    .toLowerCase()
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
}

function tokenizePlayerName(s: string): string[] {
  return normalizeComparableName(s)
    .split(' ')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
}

function sortedTokenKey(tokens: string[]): string {
  return [...tokens].sort().join('\u0001')
}

/**
 * Считаем, что это один и тот же человек (для антидублей ИИ/подсказок):
 * — полное совпадение строки;
 * — те же слова в другом порядке (Имя Фамилия / Фамилия Имя);
 * — мононим совпадает с первым или последним словом полного имени либо с любым токеном (длина ≥ 2);
 * — у двух многословных имён совпадают первое и последнее слово (в том или ином порядке).
 */
export function namesLikelySamePerson(aRaw: string, bRaw: string): boolean {
  const na = normalizeComparableName(aRaw)
  const nb = normalizeComparableName(bRaw)
  if (!na || !nb) return false
  if (na === nb) return true

  const a = tokenizePlayerName(aRaw)
  const b = tokenizePlayerName(bRaw)
  if (a.length === 0 || b.length === 0) return false

  if (a.length === b.length && sortedTokenKey(a) === sortedTokenKey(b)) {
    return true
  }

  if (a.length === 1 && b.length >= 2) {
    return mononymMatchesMultiTokenName(a[0]!, b)
  }
  if (b.length === 1 && a.length >= 2) {
    return mononymMatchesMultiTokenName(b[0]!, a)
  }

  if (a.length >= 2 && b.length >= 2) {
    const af = a[0]!
    const al = a[a.length - 1]!
    const bf = b[0]!
    const bl = b[b.length - 1]!
    if (af === bf && al === bl) return true
    if (af === bl && al === bf) return true
  }

  return false
}

function mononymMatchesMultiTokenName(single: string, multi: string[]): boolean {
  if (single.length < 2) return false
  const first = multi[0]!
  const last = multi[multi.length - 1]!
  if (single === first || single === last) return true
  return multi.some((t) => t.length >= 2 && t === single)
}

export function isDraftedPlayerNameTaken(
  candidateName: string,
  usedPlayerNames: readonly string[],
): boolean {
  const c = normalizeSpaces(candidateName.trim())
  if (!c.length) return false
  return usedPlayerNames.some((u) => namesLikelySamePerson(c, u))
}

export function existingPickedPlayerNames(state: GameState): string[] {
  const names: string[] = []
  for (const teamId of state.teamOrder) {
    const team = state.teams[teamId]
    for (const pick of Object.values(team.picksBySlotId)) {
      const n = pick.playerName?.trim()
      if (n) names.push(normalizeSpaces(n))
    }
  }
  return names
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
  usedPlayerNames: readonly string[]
  starsForName?: (name: string) => PlayerStars | null
}): number {
  return args.candidates
    .map((x) => {
      const starsOverride = typeof x === 'string' ? (args.starsForName?.(x) ?? null) : null
      return normalizeCandidate(x, starsOverride)
    })
    .map((c) => ({ ...c, playerName: normalizeSpaces(c.playerName) }))
    .filter((c) => c.playerName.length > 0)
    .filter((c) => !isDraftedPlayerNameTaken(c.playerName, args.usedPlayerNames)).length
}

function pickBestFromCandidates(args: {
  candidates: readonly (string | RandomPlayerCandidate)[]
  usedPlayerNames: readonly string[]
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
    .filter((c) => !isDraftedPlayerNameTaken(c.playerName, args.usedPlayerNames))

  if (pool.length === 0) return null

  const maxStars = pool.reduce((m, c) => (c.stars > m ? c.stars : m), pool[0]!.stars)
  const best = pool.filter((c) => c.stars === maxStars)
  const { item } = drawRandom(best, args.rng)
  return { playerName: item.playerName, stars: item.stars }
}

export function pickRandomTop15Player(args: {
  country: string
  position: string
  usedPlayerNames: readonly string[]
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
    if (isDraftedPlayerNameTaken(normalized.playerName, args.usedPlayerNames)) {
      continue
    }
    return { playerName: normalized.playerName, stars: normalized.stars }
  }

  return null
}

export function pickRandomTop30Player(args: {
  country: string
  position: string
  usedPlayerNames: readonly string[]
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
    if (isDraftedPlayerNameTaken(normalized.playerName, args.usedPlayerNames)) continue
    return { playerName: normalized.playerName, stars: normalized.stars }
  }

  return null
}

export function pickRandomRplPlayer(args: {
  club: string
  position: string
  usedPlayerNames: readonly string[]
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
    if (isDraftedPlayerNameTaken(normalized.playerName, args.usedPlayerNames)) continue
    return { playerName: normalized.playerName, stars: normalized.stars }
  }

  return null
}

export function pickRandomEuroClubPlayer(args: {
  club: string
  position: string
  usedPlayerNames: readonly string[]
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
    if (isDraftedPlayerNameTaken(normalized.playerName, args.usedPlayerNames)) continue
    return { playerName: normalized.playerName, stars: normalized.stars }
  }

  return null
}

function pickRandomAnyOutfieldFromPool(args: {
  pool: Partial<Record<Top15RandomPosition, readonly (string | RandomPlayerCandidate)[]>>
  usedPlayerNames: readonly string[]
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
    if (isDraftedPlayerNameTaken(item.playerName, args.usedPlayerNames)) continue
    return { playerName: item.playerName, stars: item.stars }
  }

  return null
}

export function pickRandomAnyTop15OutfieldPlayer(args: {
  country: string
  usedPlayerNames: readonly string[]
  rng?: () => number
}): { playerName: string; stars: PlayerStars } | null {
  const pool = NATIONAL_TOP15_RANDOM_PLAYERS[args.country]
  if (!pool) return null
  return pickRandomAnyOutfieldFromPool({ pool, usedPlayerNames: args.usedPlayerNames, rng: args.rng })
}

export function pickRandomAnyTop30OutfieldPlayer(args: {
  country: string
  usedPlayerNames: readonly string[]
  rng?: () => number
}): { playerName: string; stars: PlayerStars } | null {
  const pool = NATIONAL_TOP30_RANDOM_PLAYERS[args.country]
  if (!pool) return null
  return pickRandomAnyOutfieldFromPool({ pool, usedPlayerNames: args.usedPlayerNames, rng: args.rng })
}

export function pickRandomAnyRplOutfieldPlayer(args: {
  club: string
  usedPlayerNames: readonly string[]
  rng?: () => number
}): { playerName: string; stars: PlayerStars } | null {
  const pool = RPL_RANDOM_PLAYERS[args.club]
  if (!pool) return null
  const picked = pickRandomAnyOutfieldFromPool({ pool, usedPlayerNames: args.usedPlayerNames, rng: args.rng })
  if (!picked) return null
  const stars = RPL_PLAYER_STARS[args.club]?.[picked.playerName] ?? picked.stars
  return { playerName: picked.playerName, stars }
}

export function pickRandomAnyEuroClubOutfieldPlayer(args: {
  club: string
  usedPlayerNames: readonly string[]
  rng?: () => number
}): { playerName: string; stars: PlayerStars } | null {
  const pool = EURO_CLUBS_RANDOM_PLAYERS[args.club]
  if (!pool) return null
  const picked = pickRandomAnyOutfieldFromPool({ pool, usedPlayerNames: args.usedPlayerNames, rng: args.rng })
  if (!picked) return null
  const stars = EURO_CLUBS_PLAYER_STARS[args.club]?.[picked.playerName] ?? picked.stars
  return { playerName: picked.playerName, stars }
}

export function pickBestTop15Player(args: {
  country: string
  position: string
  usedPlayerNames: readonly string[]
  rng?: () => number
}): BestPick | null {
  const pool = NATIONAL_TOP15_RANDOM_PLAYERS[args.country]
  if (!pool) return null
  const pos = args.position as Top15RandomPosition
  const candidates = pool[pos]
  if (!candidates || candidates.length === 0) return null
  return pickBestFromCandidates({ candidates, usedPlayerNames: args.usedPlayerNames, rng: args.rng })
}

export function countAvailableTop15Players(args: {
  country: string
  position: string
  usedPlayerNames: readonly string[]
}): number {
  const pool = NATIONAL_TOP15_RANDOM_PLAYERS[args.country]
  if (!pool) return 0
  const pos = args.position as Top15RandomPosition
  const candidates = pool[pos]
  if (!candidates || candidates.length === 0) return 0
  return countAvailableFromCandidates({ candidates, usedPlayerNames: args.usedPlayerNames })
}

export function pickBestTop30Player(args: {
  country: string
  position: string
  usedPlayerNames: readonly string[]
  rng?: () => number
}): BestPick | null {
  const pool = NATIONAL_TOP30_RANDOM_PLAYERS[args.country]
  if (!pool) return null
  const pos = args.position as Top15RandomPosition
  const candidates = pool[pos]
  if (!candidates || candidates.length === 0) return null
  return pickBestFromCandidates({ candidates, usedPlayerNames: args.usedPlayerNames, rng: args.rng })
}

export function countAvailableTop30Players(args: {
  country: string
  position: string
  usedPlayerNames: readonly string[]
}): number {
  const pool = NATIONAL_TOP30_RANDOM_PLAYERS[args.country]
  if (!pool) return 0
  const pos = args.position as Top15RandomPosition
  const candidates = pool[pos]
  if (!candidates || candidates.length === 0) return 0
  return countAvailableFromCandidates({ candidates, usedPlayerNames: args.usedPlayerNames })
}

export function pickBestRplPlayer(args: {
  club: string
  position: string
  usedPlayerNames: readonly string[]
  rng?: () => number
}): BestPick | null {
  const pool = RPL_RANDOM_PLAYERS[args.club]
  if (!pool) return null
  const pos = args.position as Top15RandomPosition
  const candidates = pool[pos]
  if (!candidates || candidates.length === 0) return null
  return pickBestFromCandidates({
    candidates,
    usedPlayerNames: args.usedPlayerNames,
    rng: args.rng,
    starsForName: (name) => RPL_PLAYER_STARS[args.club]?.[name] ?? null,
  })
}

export function countAvailableRplPlayers(args: {
  club: string
  position: string
  usedPlayerNames: readonly string[]
}): number {
  const pool = RPL_RANDOM_PLAYERS[args.club]
  if (!pool) return 0
  const pos = args.position as Top15RandomPosition
  const candidates = pool[pos]
  if (!candidates || candidates.length === 0) return 0
  return countAvailableFromCandidates({
    candidates,
    usedPlayerNames: args.usedPlayerNames,
    starsForName: (name) => RPL_PLAYER_STARS[args.club]?.[name] ?? null,
  })
}

export function pickBestEuroClubPlayer(args: {
  club: string
  position: string
  usedPlayerNames: readonly string[]
  rng?: () => number
}): BestPick | null {
  const pool = EURO_CLUBS_RANDOM_PLAYERS[args.club]
  if (!pool) return null
  const pos = args.position as Top15RandomPosition
  const candidates = pool[pos]
  if (!candidates || candidates.length === 0) return null
  return pickBestFromCandidates({
    candidates,
    usedPlayerNames: args.usedPlayerNames,
    rng: args.rng,
    starsForName: (name) => EURO_CLUBS_PLAYER_STARS[args.club]?.[name] ?? null,
  })
}

export function countAvailableEuroClubPlayers(args: {
  club: string
  position: string
  usedPlayerNames: readonly string[]
}): number {
  const pool = EURO_CLUBS_RANDOM_PLAYERS[args.club]
  if (!pool) return 0
  const pos = args.position as Top15RandomPosition
  const candidates = pool[pos]
  if (!candidates || candidates.length === 0) return 0
  return countAvailableFromCandidates({
    candidates,
    usedPlayerNames: args.usedPlayerNames,
    starsForName: (name) => EURO_CLUBS_PLAYER_STARS[args.club]?.[name] ?? null,
  })
}

function pickBestAnyOutfieldFromPool(args: {
  pool: Partial<Record<Top15RandomPosition, readonly (string | RandomPlayerCandidate)[]>>
  usedPlayerNames: readonly string[]
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
    usedPlayerNames: args.usedPlayerNames,
    rng: args.rng,
    starsForName: args.starsForName,
  })
}

function countAvailableAnyOutfieldFromPool(args: {
  pool: Partial<Record<Top15RandomPosition, readonly (string | RandomPlayerCandidate)[]>>
  usedPlayerNames: readonly string[]
  starsForName?: (name: string) => PlayerStars | null
}): number {
  const positions = Object.keys(args.pool) as Top15RandomPosition[]
  const outfield = positions
    .filter((p) => p !== 'GK')
    .flatMap((p) => [...(args.pool[p] ?? [])])
  if (outfield.length === 0) return 0
  return countAvailableFromCandidates({
    candidates: outfield,
    usedPlayerNames: args.usedPlayerNames,
    starsForName: args.starsForName,
  })
}

export function pickBestAnyTop15OutfieldPlayer(args: {
  country: string
  usedPlayerNames: readonly string[]
  rng?: () => number
}): BestPick | null {
  const pool = NATIONAL_TOP15_RANDOM_PLAYERS[args.country]
  if (!pool) return null
  return pickBestAnyOutfieldFromPool({ pool, usedPlayerNames: args.usedPlayerNames, rng: args.rng })
}

export function countAvailableAnyTop15OutfieldPlayers(args: {
  country: string
  usedPlayerNames: readonly string[]
}): number {
  const pool = NATIONAL_TOP15_RANDOM_PLAYERS[args.country]
  if (!pool) return 0
  return countAvailableAnyOutfieldFromPool({ pool, usedPlayerNames: args.usedPlayerNames })
}

export function pickBestAnyTop30OutfieldPlayer(args: {
  country: string
  usedPlayerNames: readonly string[]
  rng?: () => number
}): BestPick | null {
  const pool = NATIONAL_TOP30_RANDOM_PLAYERS[args.country]
  if (!pool) return null
  return pickBestAnyOutfieldFromPool({ pool, usedPlayerNames: args.usedPlayerNames, rng: args.rng })
}

export function countAvailableAnyTop30OutfieldPlayers(args: {
  country: string
  usedPlayerNames: readonly string[]
}): number {
  const pool = NATIONAL_TOP30_RANDOM_PLAYERS[args.country]
  if (!pool) return 0
  return countAvailableAnyOutfieldFromPool({ pool, usedPlayerNames: args.usedPlayerNames })
}

export function pickBestAnyRplOutfieldPlayer(args: {
  club: string
  usedPlayerNames: readonly string[]
  rng?: () => number
}): BestPick | null {
  const pool = RPL_RANDOM_PLAYERS[args.club]
  if (!pool) return null
  return pickBestAnyOutfieldFromPool({
    pool,
    usedPlayerNames: args.usedPlayerNames,
    rng: args.rng,
    starsForName: (name) => RPL_PLAYER_STARS[args.club]?.[name] ?? null,
  })
}

export function countAvailableAnyRplOutfieldPlayers(args: {
  club: string
  usedPlayerNames: readonly string[]
}): number {
  const pool = RPL_RANDOM_PLAYERS[args.club]
  if (!pool) return 0
  return countAvailableAnyOutfieldFromPool({
    pool,
    usedPlayerNames: args.usedPlayerNames,
    starsForName: (name) => RPL_PLAYER_STARS[args.club]?.[name] ?? null,
  })
}

export function pickBestAnyEuroClubOutfieldPlayer(args: {
  club: string
  usedPlayerNames: readonly string[]
  rng?: () => number
}): BestPick | null {
  const pool = EURO_CLUBS_RANDOM_PLAYERS[args.club]
  if (!pool) return null
  return pickBestAnyOutfieldFromPool({
    pool,
    usedPlayerNames: args.usedPlayerNames,
    rng: args.rng,
    starsForName: (name) => EURO_CLUBS_PLAYER_STARS[args.club]?.[name] ?? null,
  })
}

export function countAvailableAnyEuroClubOutfieldPlayers(args: {
  club: string
  usedPlayerNames: readonly string[]
}): number {
  const pool = EURO_CLUBS_RANDOM_PLAYERS[args.club]
  if (!pool) return 0
  return countAvailableAnyOutfieldFromPool({
    pool,
    usedPlayerNames: args.usedPlayerNames,
    starsForName: (name) => EURO_CLUBS_PLAYER_STARS[args.club]?.[name] ?? null,
  })
}

/**
 * Когда обычные эвристики не нашли игрока (пул на позиции исчерпан и т.п.),
 * берём любого доступного из пула — лучше дубль в данных, чем «CPU Player 1234».
 */
export function pickEmergencyCpuDraftPlayer(args: {
  effectiveMode: GameMode
  source: string
}): BestPick | null {
  const dupOk: string[] = []
  const m = args.effectiveMode
  if (m === 'nationalTop15') {
    return (
      pickBestAnyTop15OutfieldPlayer({ country: args.source, usedPlayerNames: dupOk }) ??
      pickBestTop15Player({ country: args.source, position: 'GK', usedPlayerNames: dupOk })
    )
  }
  if (m === 'nationalTop30') {
    return (
      pickBestAnyTop30OutfieldPlayer({ country: args.source, usedPlayerNames: dupOk }) ??
      pickBestTop30Player({ country: args.source, position: 'GK', usedPlayerNames: dupOk })
    )
  }
  if (m === 'rpl') {
    return (
      pickBestAnyRplOutfieldPlayer({ club: args.source, usedPlayerNames: dupOk }) ??
      pickBestRplPlayer({ club: args.source, position: 'GK', usedPlayerNames: dupOk })
    )
  }
  return (
    pickBestAnyEuroClubOutfieldPlayer({ club: args.source, usedPlayerNames: dupOk }) ??
    pickBestEuroClubPlayer({ club: args.source, position: 'GK', usedPlayerNames: dupOk })
  )
}

export function createTeamNumberRecord<T>(value: T): Record<TeamId, T> {
  return { team1: value, team2: value, team3: value, team4: value }
}

