import type { CpuDifficulty, DraftSourceKind, GameKind, GameMode, TeamController, TeamId } from '../core/types'

/** Управляется ли команда компьютером в текущем режиме. */
export function isCpuControlledTeam(
  ctx: {
    gameKind: GameKind
    teamOrder: readonly TeamId[]
    teamControllers: Record<TeamId, TeamController>
  },
  teamId: TeamId,
): boolean {
  if (ctx.gameKind === 'vsCpu' && ctx.teamOrder.length === 2) return teamId === 'team2'
  return ctx.teamControllers[teamId] === 'cpu'
}

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

export function isUnfairCpuDifficulty(difficulty: CpuDifficulty): boolean {
  return difficulty === 'unfair'
}

/** Флаг страны vs клуба на слоте / в шапке. */
export function isNationalDraftSource(mode: GameMode, chaosSourceKind: DraftSourceKind | null): boolean {
  if (isNationalMode(mode)) return true
  if (mode === 'chaos' && chaosSourceKind === 'national') return true
  return false
}
