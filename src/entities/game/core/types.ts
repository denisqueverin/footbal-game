import type { FormationId } from './formations'

export type TeamId = 'team1' | 'team2' | 'team3' | 'team4'
export type TeamCount = 2 | 3 | 4

/** Сколько подсказок «Лучший состав» у каждой команды за всю игру (выбор в меню). */
export type HintsBudget = 1 | 2 | 3

/** Сколько подсказок «Случайный игрок» у каждой команды за всю игру (Сборные ТОП-15 и РПЛ). */
export type RandomPlayerHintsBudget = 1 | 2 | 3 | 11

export type GamePhase = 'setup' | 'drawReveal' | 'drafting' | 'finished'

/** Формат партии: обычная (несколько людей) или против компьютера (1 игрок). */
export type GameKind = 'multi' | 'vsCpu'

export type CpuDifficulty = 'beginner' | 'normal' | 'hard'

export type GameMode = 'nationalTop15' | 'nationalTop30' | 'clubs' | 'rpl' | 'chaos'

/** Тип источника раунда (для режима «Хаос» и подсказок). */
export type DraftSourceKind = 'national' | 'club' | 'rplClub'

export type ColorSchemeId = 'green' | 'red' | 'blue' | 'white'

export type SlotPick = {
  slotId: string
  label: string
  playerName: string | null
  country: string | null
  /** Уровень игрока (звёзды 1–5). Не показываем в UI, но храним в состоянии. */
  playerStars: 1 | 2 | 3 | 4 | 5 | null
  /** Кто поставил игрока. В UI показываем звёзды только для cpu. */
  pickedBy: 'human' | 'cpu' | null
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
  gameKind: GameKind
  cpuDifficulty: CpuDifficulty
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

  /** Лимит подсказок «Случайный игрок» на команду за игру (1/2/3/11). */
  randomPlayerHintsBudgetPerPlayer: RandomPlayerHintsBudget
  /** Сколько подсказок «Случайный игрок» осталось у каждой команды. */
  randomPlayerHintsRemaining: Record<TeamId, number>
  /** Последняя ошибка подсказки «Случайный игрок» (для модалки). */
  randomPlayerHintError: { team: TeamId; sourceLabel: string; position: string } | null

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

