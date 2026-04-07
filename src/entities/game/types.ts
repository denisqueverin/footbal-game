import type { FormationId } from './formations'

export type TeamId = 'team1' | 'team2' | 'team3' | 'team4'
export type TeamCount = 2 | 3 | 4

/** Сколько подсказок «Лучший состав» у каждой команды за всю игру (выбор в меню). */
export type HintsBudget = 1 | 2 | 3

export type GamePhase = 'setup' | 'drawReveal' | 'drafting' | 'finished'

export type GameMode = 'nationalTop15' | 'nationalTop30' | 'clubs' | 'rpl' | 'chaos'

/** Тип источника раунда (для режима «Хаос» и подсказок). */
export type DraftSourceKind = 'national' | 'club' | 'rplClub'

export type ColorSchemeId = 'green' | 'red' | 'blue' | 'white'

export type SlotPick = {
  slotId: string
  label: string
  playerName: string | null
  country: string | null
}

export type TeamState = {
  id: TeamId
  name: string
  formation: FormationId
  colorScheme: ColorSchemeId
  picksBySlotId: Record<string, SlotPick>
}

export type GameState = {
  phase: GamePhase
  formationLocked: boolean
  teamOrder: TeamId[]
  mode: GameMode

  /** Показывать в подсказке «Лучший состав» скамейку запасных или только стартовых 11. */
  bestLineupIncludeBench: boolean

  /** Лимит подсказок «Лучший состав» на команду за игру (1–3). */
  hintsBudgetPerPlayer: HintsBudget
  /** Сколько подсказок осталось у каждой команды. */
  hintsRemaining: Record<TeamId, number>
  /** Уже использовали подсказку в текущем раунде (сбрасывается при новом раунде). */
  hintUsedThisRound: Record<TeamId, boolean>

  /** Случайное смещение стартового хода в раунде 1 (0 .. teamOrder.length-1). */
  draftTurnOrderBase: number

  countriesAll: string[]
  countriesRemaining: string[]
  /** Параллельно countriesRemaining — только режим «Хаос». */
  chaosDraftSourceKindsRemaining: DraftSourceKind[]
  chaosDraftSourceKindsAll: DraftSourceKind[]
  currentCountry: string | null
  /** Режим «Хаос»: тип текущего раунда; в остальных режимах null. */
  currentDraftSourceKind: DraftSourceKind | null
  roundIndex: number
  maxRounds: number

  turn: TeamId
  teams: Record<TeamId, TeamState>

  /** Метка времени старта драфта (performance.now-совместимо: Date.now). */
  draftTimerStartedAt: number | null
  /** Пока не null — таймер на паузе (режим редактирования составов). */
  draftTimerPausedAt: number | null
  /** Накопленная пауза (мс), без текущего интервала draftTimerPausedAt. */
  draftTimerPausedAccumMs: number
}

