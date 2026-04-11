import type { GameState } from './types'

/** Есть ли в активных командах хотя бы один CPU. */
export function hasAnyCpuTeam(state: GameState): boolean {
  if (state.gameKind === 'vsCpu') return true
  return state.teamOrder.some((id) => state.teamControllers[id] === 'cpu')
}

/**
 * Подсказка «Лучший состав»: со скамейкой или без.
 * Без скамейки только при сложности CPU «Хард», если в матче есть компьютер.
 * Во всех остальных случаях — со скамейкой.
 */
export function computeBestLineupIncludeBench(state: GameState): boolean {
  if (!hasAnyCpuTeam(state)) return true
  return state.cpuDifficulty !== 'hard'
}

export function withBestLineupBenchRule<T extends GameState>(state: T): T {
  return { ...state, bestLineupIncludeBench: computeBestLineupIncludeBench(state) }
}
