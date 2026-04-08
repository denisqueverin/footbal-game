import type { DraftSourceKind, GameMode } from '../core/types'

export function isNationalMode(mode: GameMode): boolean {
  return mode === 'nationalTop15' || mode === 'nationalTop30'
}

export function isClubsMode(mode: GameMode): boolean {
  return mode === 'clubs' || mode === 'rpl'
}

export function isChaosMode(mode: GameMode): boolean {
  return mode === 'chaos'
}

/** Подсказка «Лучший состав» доступна. */
export function supportsBestLineupHint(mode: GameMode): boolean {
  return isNationalMode(mode) || isClubsMode(mode) || isChaosMode(mode)
}

/** Флаг страны vs клуба на слоте / в шапке. */
export function isNationalDraftSource(mode: GameMode, chaosSourceKind: DraftSourceKind | null): boolean {
  if (isNationalMode(mode)) return true
  if (mode === 'chaos' && chaosSourceKind === 'national') return true
  return false
}
