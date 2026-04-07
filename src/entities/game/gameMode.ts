import type { GameMode } from './types'

export function isNationalMode(mode: GameMode): boolean {
  return mode === 'nationalTop15' || mode === 'nationalTop30'
}

export function isClubsMode(mode: GameMode): boolean {
  return mode === 'clubs'
}
