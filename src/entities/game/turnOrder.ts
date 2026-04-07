import type { TeamId } from './types'

export function rotateTeamOrder<T>(order: readonly T[], shift: number): T[] {
  const n = order.length
  if (n === 0) return []
  const s = ((shift % n) + n) % n
  return [...order.slice(s), ...order.slice(0, s)]
}

/**
 * Порядок ходов в раунде с номером `roundIndex` (1-based).
 * В раунде 1 случайно выбирается, кто ходит первым (`draftTurnOrderBase`);
 * в каждом следующем раунде стартовый игрок сдвигается по кругу.
 */
export function roundTurnOrder(
  teamOrder: readonly TeamId[],
  draftTurnOrderBase: number,
  roundIndex: number,
): TeamId[] {
  const n = teamOrder.length
  if (n === 0) return []
  const shift = (draftTurnOrderBase + roundIndex - 1 + n * 64) % n
  return rotateTeamOrder(teamOrder, shift)
}
