import type { ColorSchemeId, TeamId, TeamState } from './types'

/** Варианты форм в настройках (футболка + шорты). */
export const SETUP_COLOR_SCHEME_PICKS: ReadonlyArray<{ id: ColorSchemeId; label: string }> = [
  { id: 'kitRedWhite', label: 'Красно-белая' },
  { id: 'kitBlueWhite', label: 'Синяя и белая' },
  { id: 'kitMilan', label: 'Красно-чёрная (Милан)' },
  { id: 'kitJuventus', label: 'Бело-чёрная (Ювентус)' },
  { id: 'kitBarcelona', label: 'Сине-гранатовая (Барселона)' },
  { id: 'kitRealMadrid', label: 'Белая с золотом (Реал Мадрид)' },
  { id: 'kitLiverpool', label: 'Красная (Ливерпуль)' },
  { id: 'kitBrazil', label: 'Жёлто-синяя (Бразилия)' },
  { id: 'kitNetherlands', label: 'Оранжевая (Нидерланды)' },
  { id: 'kitPSG', label: 'Сине-красная (ПСЖ)' },
  { id: 'kitArsenalCherry', label: 'Вишневая (Арсенал)' },
  { id: 'kitLokomotiv', label: 'Красно-зелёная (Локомотив)' },
  { id: 'kitSynthwave', label: 'Неоновая «синтвейв»' },
  { id: 'kitAcidTech', label: 'Кислотная «ночь»' },
]

const PICKABLE_SCHEME_SET = new Set<ColorSchemeId>(SETUP_COLOR_SCHEME_PICKS.map((p) => p.id))

export function isPickableColorSchemeId(scheme: ColorSchemeId): boolean {
  return PICKABLE_SCHEME_SET.has(scheme)
}

/** Старые сохранения и нормализация из localStorage. */
export function normalizeColorSchemeId(raw: unknown): ColorSchemeId {
  if (raw === 'green') return 'kitBarcelona'
  if (raw === 'red') return 'kitRedWhite'
  if (raw === 'blue') return 'kitBlueWhite'
  if (raw === 'white') return 'kitJuventus'
  if (raw === 'kitRedWhite') return 'kitRedWhite'
  if (raw === 'kitBlueWhite') return 'kitBlueWhite'
  if (raw === 'kitMilan') return 'kitMilan'
  if (raw === 'kitJuventus') return 'kitJuventus'
  if (raw === 'kitBarcelona') return 'kitBarcelona'
  if (raw === 'kitRealMadrid') return 'kitRealMadrid'
  if (raw === 'kitLiverpool') return 'kitLiverpool'
  if (raw === 'kitBrazil') return 'kitBrazil'
  if (raw === 'kitNetherlands') return 'kitNetherlands'
  if (raw === 'kitPSG') return 'kitPSG'
  if (raw === 'kitArsenalCherry') return 'kitArsenalCherry'
  if (raw === 'kitLokomotiv') return 'kitLokomotiv'
  if (raw === 'kitSynthwave') return 'kitSynthwave'
  if (raw === 'kitAcidTech') return 'kitAcidTech'
  return 'kitBarcelona'
}

const PICK_PREFERENCE: ColorSchemeId[] = SETUP_COLOR_SCHEME_PICKS.map((p) => p.id)

/** У активных команд в `order` не должно совпадать `colorScheme`. */
export function dedupeColorSchemesForActiveOrder(
  teams: Record<TeamId, TeamState>,
  order: TeamId[],
): Record<TeamId, TeamState> {
  const used = new Set<ColorSchemeId>()
  const next: Record<TeamId, TeamState> = { ...teams }
  for (const tid of order) {
    let scheme = normalizeColorSchemeId(next[tid].colorScheme)
    if (!isPickableColorSchemeId(scheme)) {
      scheme = 'kitBarcelona'
    }
    if (used.has(scheme)) {
      const free = PICK_PREFERENCE.find((id) => !used.has(id))
      scheme = free ?? scheme
    }
    used.add(scheme)
    next[tid] = { ...next[tid], colorScheme: scheme }
  }
  return next
}
