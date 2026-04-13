import { formationRowsForDisplay } from './formations'
import type { TeamState } from './types'

/**
 * Капитан для нейро-команды (и запасной логикой для старых сохранений):
 * для каждого уровня звёзд 5 → 1: сначала вратарь с таким рейтингом, затем любой полевой с тем же рейтингом;
 * если ни у кого нет звёзд в данных — первый занятый слот по порядку отображения схемы.
 */
export function pickCpuCaptainSlotId(team: TeamState): string | null {
  const rows = formationRowsForDisplay(team.formation)
  const slots: Array<{ slotId: string; isGk: boolean }> = []
  for (const row of rows) {
    for (const cell of row) {
      slots.push({ slotId: cell.slotId, isGk: cell.slotId === 'gk' })
    }
  }

  for (let stars = 5; stars >= 1; stars -= 1) {
    for (const { slotId, isGk } of slots) {
      if (!isGk) continue
      const pick = team.picksBySlotId[slotId]
      if (!pick?.playerName || pick.playerStars !== stars) continue
      return slotId
    }
    for (const { slotId, isGk } of slots) {
      if (isGk) continue
      const pick = team.picksBySlotId[slotId]
      if (!pick?.playerName || pick.playerStars !== stars) continue
      return slotId
    }
  }

  for (const { slotId } of slots) {
    if (team.picksBySlotId[slotId]?.playerName) return slotId
  }
  return null
}

/** Совместимость: то же, что pickCpuCaptainSlotId. */
export function pickDefaultCaptainSlotId(team: TeamState): string | null {
  return pickCpuCaptainSlotId(team)
}
