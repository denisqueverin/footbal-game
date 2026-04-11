import { buildCoachPoolsForDraft, type CoachPoolsDraftContext } from '../data/coaches'
import type { CoachDraftPhaseState, GameMode, TeamId } from './types'

export type CoachDraftPoolsContext = CoachPoolsDraftContext

export function buildInitialCoachDraftState(
  order: TeamId[],
  mode: GameMode,
  ctx: CoachDraftPoolsContext,
): CoachDraftPhaseState {
  return {
    step: 'eliminate',
    pools: buildCoachPoolsForDraft(order, mode, ctx),
    eliminationStepIndex: 0,
    activeIndex: 0,
    pendingEliminateIds: [],
  }
}

/** Сколько шагов снятия тренеров до фазы выбора из двух (по одному снятию за шаг). */
export function coachDraftEliminationTotalSteps(teamCount: number): number {
  return 3 * teamCount
}

/** Кто убирает на глобальном шаге s: order[s % n]. */
export function coachDraftPickerAtStep(order: TeamId[], step: number): TeamId {
  const n = order.length
  return order[step % n]!
}

/**
 * У кого убирают на шаге s: волны «у соседа по кругу, потом через одного, …».
 * Шаги s = 0..n-1: у order[(i+1)%n]; s = n..2n-1: у order[(i+2)%n]; … для n=4 — 1→2,2→3,3→4,4→1, затем 1→3,2→4,…
 * Для n=2 только один соперник — чередуется тот же парный обмен.
 */
export function coachDraftVictimAtStep(order: TeamId[], step: number): TeamId {
  const n = order.length
  if (n <= 1) return order[0]!
  const pickerIndex = step % n
  const wave = Math.floor(step / n) % Math.max(1, n - 1)
  const victimIndex = (pickerIndex + 1 + wave) % n
  return order[victimIndex]!
}
