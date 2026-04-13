import type { GameState, TeamId } from './types'

/** Имя по умолчанию для слота («Команда 1» для первого в очереди и т.д.). */
export function isDefaultDrawRevealSlotName(
  order: readonly TeamId[],
  teamId: TeamId,
  rawName: string,
): boolean {
  const idx = order.indexOf(teamId)
  if (idx < 0) return false
  return rawName.trim() === `Команда ${idx + 1}`
}

/** Можно переходить к тренерам / драфту: у каждой команды в партии есть своё имя (не плейсхолдер). */
export function canAdvanceFromDrawRevealIdentity(state: GameState): boolean {
  const order = state.teamOrder
  for (const tid of order) {
    const n = state.teams[tid].name.trim()
    if (!n) return false
    if (isDefaultDrawRevealSlotName(order, tid, state.teams[tid].name)) return false
  }
  return true
}
