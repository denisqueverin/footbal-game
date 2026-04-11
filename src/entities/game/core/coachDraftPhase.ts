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

/** Кто убирает на глобальном шаге s (0..3n-1): order[s % n]. */
export function coachDraftPickerAtStep(order: TeamId[], step: number): TeamId {
  const n = order.length
  return order[step % n]!
}

/** У кого убирают на шаге s: order[(s+1) % n] — первый у второго, второй у первого и т.д. */
export function coachDraftVictimAtStep(order: TeamId[], step: number): TeamId {
  const n = order.length
  return order[(step + 1) % n]!
}
