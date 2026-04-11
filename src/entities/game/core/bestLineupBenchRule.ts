import { isCpuControlledTeam } from '../modes/gameMode'
import type { GameState } from './types'

/** Есть ли в активных командах хотя бы один CPU. */
export function hasAnyCpuTeam(state: GameState): boolean {
  if (state.gameKind === 'vsCpu') return true
  return state.teamOrder.some((id) => state.teamControllers[id] === 'cpu')
}

/**
 * Подсказка «Лучший состав»: со скамейкой или без.
 * Без скамейки, если хотя бы один компьютер в матче играет на «Хард».
 * Во всех остальных случаях — со скамейкой.
 */
export function computeBestLineupIncludeBench(state: GameState): boolean {
  if (!hasAnyCpuTeam(state)) return true
  const ctx = {
    gameKind: state.gameKind,
    teamOrder: state.teamOrder,
    teamControllers: state.teamControllers,
  }
  const anyCpuHard = state.teamOrder.some(
    (id) => isCpuControlledTeam(ctx, id) && state.cpuDifficultyByTeam[id] === 'hard',
  )
  return !anyCpuHard
}

export function withBestLineupBenchRule<T extends GameState>(state: T): T {
  return { ...state, bestLineupIncludeBench: computeBestLineupIncludeBench(state) }
}
