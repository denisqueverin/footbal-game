import type { FormationId } from './formations'

export type TeamId = 'team1' | 'team2' | 'team3' | 'team4'
/** Сколько людей за столом: 1 = вы против компьютера (2 команды). */
export type TeamCount = 1 | 2 | 3 | 4

/** Сколько подсказок «Лучший состав» у каждой команды за всю игру (выбор в меню). 0 — выключено; 11 — только режим разработки. */
export type HintsBudget = 0 | 1 | 2 | 3 | 11

/** Сколько подсказок «Случайный игрок» у каждой команды за всю игру. 0 — подсказки выключены. */
export type RandomPlayerHintsBudget = 0 | 1 | 2 | 3 | 11

export type GamePhase = 'setup' | 'drawReveal' | 'drafting' | 'finished'

/** Формат партии: обычная (несколько людей) или против компьютера (1 игрок). */
export type GameKind = 'multi' | 'vsCpu'

/** «Нечестный» — компьютер набирает из общего сильного пула, не из источника раунда. */
export type CpuDifficulty = 'beginner' | 'normal' | 'hard' | 'unfair'

export type GameMode = 'nationalTop15' | 'nationalTop30' | 'clubs' | 'rpl' | 'chaos'

export type TeamController = 'human' | 'cpu'

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

  /** Кто управляет каждой командой: человек или компьютер. */
  teamControllers: Record<TeamId, TeamController>

  /** Показывать в подсказке «Лучший состав» скамейку запасных или только стартовых 11. */
  bestLineupIncludeBench: boolean

  /** Лимит подсказок «Лучший состав» на команду за игру (0–3). */
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

  /** Суммарное время (мс), пока у команды был ход в фазе драфта (без учёта паузы таймера). */
  draftTurnAccumMs: Record<TeamId, number>
  /** Начало текущего отрезка хода для `turn` (null на паузе или вне драфта). */
  draftTurnSliceStartedAt: number | null
}

