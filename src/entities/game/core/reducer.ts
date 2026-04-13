import {
  dedupeColorSchemesForActiveOrder,
  isPickableColorSchemeId,
} from './colorSchemes'
import { FORMATIONS, type FormationId } from './formations'
import { buildChaosDraftPool } from '../modes/chaosDraftPool'
import { isCpuControlledTeam, supportsBestLineupHint } from '../modes/gameMode'
import { pickCpuCaptainSlotId } from './captainUtils'
import { TOP_50_EURO_CLUBS } from '../data/topClubs'
import { RPL_CLUBS } from '../data/rplClubs'
import type {
  ColorSchemeId,
  DevNeuroTeamNameMode,
  DraftSourceKind,
  GameMode,
  GameState,
  CpuDifficulty,
  HintsBudget,
  RandomPlayerHintsBudget,
  SlotPick,
  TeamCount,
  TeamController,
  TeamId,
  TeamState,
} from './types'
import { seedCpuNeuroBaseNames } from '../data/teamNames'
import { drawRandom } from './random'
import {
  existingPickedPlayerNames,
  pickRandomEuroClubPlayer,
  pickRandomRplPlayer,
  pickRandomTop15Player,
  pickRandomTop30Player,
} from '../hints/randomPlayerHint'
import { resolvePlayerStarsForDraftedName } from '../hints/resolvePlayerStars'
import {
  TOP_15_FOOTBALL_COUNTRIES_RU,
  TOP_30_FOOTBALL_COUNTRIES_RU,
  pickRandomUnique,
} from '../data/topCountries'
import { roundTurnOrder } from './turnOrder'
import { canAdvanceFromDrawRevealIdentity } from './drawRevealIdentity'
import { withBestLineupBenchRule } from './bestLineupBenchRule'
import {
  buildInitialCoachDraftState,
  coachDraftEliminationTotalSteps,
  coachDraftVictimAtStep,
} from './coachDraftPhase'

export type GameAction =
  | { type: 'setup/start'; devToolsEnabled?: boolean }
  | { type: 'coachDraft/toggleEliminate'; coachId: string }
  | { type: 'coachDraft/confirmEliminate' }
  /** Одним шагом снять тренера с колонки жертвы (клик по карточке). */
  | { type: 'coachDraft/eliminateCoach'; coachId: string }
  | { type: 'coachDraft/selectFinalCoach'; coachId: string }
  | { type: 'formationPick/selectFormation'; formation: FormationId }
  | { type: 'drawReveal/continue' }
  | { type: 'drawReveal/setTeamName'; team: TeamId; name: string }
  | { type: 'drawReveal/setTeamColorScheme'; team: TeamId; scheme: ColorSchemeId }
  | { type: 'drawReveal/seedCpuTeamNames' }
  | { type: 'setup/setDevNeuroTeamNameMode'; mode: DevNeuroTeamNameMode }
  | { type: 'setup/setMode'; mode: GameMode }
  | { type: 'setup/setCpuDifficultyForTeam'; team: TeamId; difficulty: CpuDifficulty }
  | { type: 'setup/setTeamCount'; count: TeamCount }
  | { type: 'setup/setTeamController'; team: TeamId; controller: TeamController }
  | { type: 'setup/setTeamFormation'; team: TeamId; formation: FormationId }
  | { type: 'setup/setTeamColorScheme'; team: TeamId; scheme: ColorSchemeId }
  | { type: 'setup/setHintsBudget'; budget: HintsBudget }
  | { type: 'setup/setRandomPlayerHintsBudget'; budget: RandomPlayerHintsBudget }
  | { type: 'setup/applyDevPreset' }
  | {
      type: 'draft/confirmPick'
      team: TeamId
      slotId: string
      playerName: string
      playerStars?: 1 | 2 | 3 | 4 | 5 | null
      pickedBy?: 'human' | 'cpu' | null
    }
  | { type: 'draft/setDraftTimerPaused'; paused: boolean }
  | { type: 'draft/setPickPlayerName'; team: TeamId; slotId: string; playerName: string }
  | { type: 'draft/useBestLineupHint'; team: TeamId }
  | { type: 'draft/useRandomPlayerHint'; team: TeamId; slotId: string }
  | { type: 'draft/clearRandomPlayerHintError' }
  | { type: 'captainPick/selectCaptain'; team: TeamId; slotId: string }
  | { type: 'game/reset' }

const ALL_TEAMS: TeamId[] = ['team1', 'team2', 'team3', 'team4']

function emptyDraftTurnAccumMs(): Record<TeamId, number> {
  return { team1: 0, team2: 0, team3: 0, team4: 0 }
}

/** Закрыть отрезок времени текущего хода (`turn`) и добавить в накопители. */
function commitCurrentTurnSlice(state: GameState, now: number): GameState {
  if (state.phase !== 'drafting' || state.draftTurnSliceStartedAt == null) return state
  const dt = Math.max(0, now - state.draftTurnSliceStartedAt)
  const team = state.turn
  return {
    ...state,
    draftTurnAccumMs: {
      ...state.draftTurnAccumMs,
      [team]: (state.draftTurnAccumMs[team] ?? 0) + dt,
    },
    draftTurnSliceStartedAt: null,
  }
}

/** Начать отсчёт для текущего `turn` (не на паузе и в фазе драфта). */
function openCurrentTurnSlice(state: GameState, now: number): GameState {
  if (state.phase !== 'drafting') return state
  if (state.draftTimerPausedAt != null) return { ...state, draftTurnSliceStartedAt: null }
  return { ...state, draftTurnSliceStartedAt: now }
}

function teamOrderForCount(count: TeamCount): TeamId[] {
  if (count === 1) return ['team1', 'team2']
  return ALL_TEAMS.slice(0, count)
}

function nextTeamId(current: TeamId, order: TeamId[]): TeamId {
  const idx = order.indexOf(current)
  if (idx < 0) return order[0] ?? current
  return order[(idx + 1) % order.length] ?? current
}

function slotPickForFormationSlot(team: TeamState, slotId: string): SlotPick | null {
  for (const row of FORMATIONS[team.formation].rows) {
    for (const cell of row) {
      if (cell.slotId === slotId) {
        return {
          slotId: cell.slotId,
          label: cell.label,
          playerName: null,
          country: null,
          playerStars: null,
          pickedBy: null,
        }
      }
    }
  }
  return null
}

function createHintsRemaining(budget: number): Record<TeamId, number> {
  return { team1: budget, team2: budget, team3: budget, team4: budget }
}

function createRandomPlayerHintsRemaining(budget: number): Record<TeamId, number> {
  return { team1: budget, team2: budget, team3: budget, team4: budget }
}

function createHintUsedThisRound(): Record<TeamId, boolean> {
  return { team1: false, team2: false, team3: false, team4: false }
}

function defaultTeamControllers(): Record<TeamId, TeamController> {
  return { team1: 'human', team2: 'human', team3: 'human', team4: 'human' }
}

function makeEmptyTeam(
  team: TeamId,
  formation: FormationId,
  name: string,
  colorScheme: ColorSchemeId,
): TeamState {
  const picksBySlotId: Record<string, SlotPick> = {}
  for (const row of FORMATIONS[formation].rows) {
    for (const cell of row) {
      picksBySlotId[cell.slotId] = {
        slotId: cell.slotId,
        label: cell.label,
        playerName: null,
        country: null,
        playerStars: null,
        pickedBy: null,
      }
    }
  }
  return {
    id: team,
    name,
    formation,
    colorScheme,
    coach: null,
    picksBySlotId,
    captainSlotId: null,
  }
}

/** Новая схема поля до драфта игроков: слоты сбрасываем, тренера сохраняем. */
function rebuildTeamWithFormation(prev: TeamState, formation: FormationId): TeamState {
  const base = makeEmptyTeam(prev.id, formation, prev.name, prev.colorScheme)
  return { ...base, coach: prev.coach }
}

function isTeamFull(team: TeamState): boolean {
  return Object.values(team.picksBySlotId).every((p) => Boolean(p.playerName))
}

function allActiveTeamsFull(state: GameState): boolean {
  return state.teamOrder.every((id) => isTeamFull(state.teams[id]))
}

/** После выбора капитана: автокапитаны для CPU подряд, затем либо следующий человек, либо финиш. */
function advanceCaptainPickAfterSelection(state: GameState, startIndex: number): GameState {
  const order = state.teamOrder
  let s: GameState = { ...state, captainPick: { activeIndex: startIndex } }
  let i = startIndex
  while (i < order.length && isCpuControlledTeam(s, order[i]!)) {
    const tid = order[i]!
    const slot = pickCpuCaptainSlotId(s.teams[tid])
    if (!slot) {
      return { ...s, phase: 'finished', captainPick: null, draftTurnSliceStartedAt: null }
    }
    s = {
      ...s,
      teams: {
        ...s.teams,
        [tid]: { ...s.teams[tid], captainSlotId: slot },
      },
      captainPick: { activeIndex: i + 1 },
    }
    i += 1
  }
  if (i >= order.length) {
    return { ...s, phase: 'finished', captainPick: null, draftTurnSliceStartedAt: null }
  }
  return { ...s, captainPick: { activeIndex: i } }
}

function beginCaptainPickPhase(state: GameState): GameState {
  const base: GameState = {
    ...state,
    phase: 'captainPick',
    captainPick: { activeIndex: 0 },
    draftTurnSliceStartedAt: null,
  }
  return advanceCaptainPickAfterSelection(base, 0)
}

function drawNextCountry(state: GameState): GameState {
  if (state.roundIndex >= state.maxRounds) {
    return { ...state, currentCountry: null, currentDraftSourceKind: null }
  }
  if (state.countriesRemaining.length === 0) {
    return { ...state, currentCountry: null, currentDraftSourceKind: null }
  }

  if (state.mode === 'chaos') {
    const n = state.countriesRemaining.length
    const idx = Math.floor(Math.random() * n)
    const label = state.countriesRemaining[idx]!
    const kind = state.chaosDraftSourceKindsRemaining[idx]!
    const rest = state.countriesRemaining.filter((_, i) => i !== idx)
    const restKinds = state.chaosDraftSourceKindsRemaining.filter((_, i) => i !== idx)
    return {
      ...state,
      currentCountry: label,
      currentDraftSourceKind: kind,
      countriesRemaining: rest,
      chaosDraftSourceKindsRemaining: restKinds,
      roundIndex: state.roundIndex + 1,
      hintUsedThisRound: createHintUsedThisRound(),
    }
  }

  const { item, rest } = drawRandom(state.countriesRemaining)
  return {
    ...state,
    currentCountry: item,
    currentDraftSourceKind: null,
    countriesRemaining: rest,
    roundIndex: state.roundIndex + 1,
    hintUsedThisRound: createHintUsedThisRound(),
  }
}

/** После выбора схемы или жеребьёвки перед драфтом игроков (старые сохранения). */
function beginDraftingPhase(state: GameState): GameState {
  const base: GameState = { ...state, phase: 'drafting' }
  const drawn = drawNextCountry(base)
  if (!drawn.currentCountry) {
    return { ...drawn, phase: 'finished', captainPick: null }
  }
  const first = roundTurnOrder(drawn.teamOrder, drawn.draftTurnOrderBase, drawn.roundIndex)[0]
  const startedAt = drawn.draftTimerStartedAt ?? Date.now()
  return {
    ...drawn,
    captainPick: null,
    turn: first ?? drawn.turn,
    draftTimerStartedAt: startedAt,
    draftTimerPausedAt: null,
    draftTimerPausedAccumMs: drawn.draftTimerPausedAccumMs,
    draftTurnAccumMs: emptyDraftTurnAccumMs(),
    draftTurnSliceStartedAt: startedAt,
  }
}

export function createInitialGameState(): GameState {
  const base: GameState = {
    phase: 'setup',
    gameKind: 'multi',
    cpuDifficultyByTeam: {
      team1: 'normal',
      team2: 'normal',
      team3: 'normal',
      team4: 'normal',
    },
    formationLocked: false,
    teamOrder: ['team1', 'team2'],
    mode: 'nationalTop15',
    coachDraft: null,
    formationPick: null,
    captainPick: null,
    teamControllers: defaultTeamControllers(),
    draftTurnOrderBase: 0,
    devToolsEnabled: false,
    devNeuroTeamNameMode: 'generate',

    bestLineupIncludeBench: true,

    hintsBudgetPerPlayer: 3,
    hintsRemaining: createHintsRemaining(3),
    hintUsedThisRound: createHintUsedThisRound(),

    randomPlayerHintsBudgetPerPlayer: 3,
    randomPlayerHintsRemaining: createRandomPlayerHintsRemaining(3),
    randomPlayerHintError: null,

    countriesAll: [],
    countriesRemaining: [],
    chaosDraftSourceKindsRemaining: [],
    chaosDraftSourceKindsAll: [],
    currentCountry: null,
    currentDraftSourceKind: null,
    roundIndex: 0,
    maxRounds: 11,

    turn: 'team1',
    teams: {
      team1: makeEmptyTeam('team1', '1-4-3-3', 'Команда 1', 'kitBarcelona'),
      team2: makeEmptyTeam('team2', '1-4-3-3', 'Команда 2', 'kitMilan'),
      team3: makeEmptyTeam('team3', '1-4-3-3', 'Команда 3', 'kitJuventus'),
      team4: makeEmptyTeam('team4', '1-4-3-3', 'Команда 4', 'kitLiverpool'),
    },

    draftTimerStartedAt: null,
    draftTimerPausedAt: null,
    draftTimerPausedAccumMs: 0,

    draftTurnAccumMs: emptyDraftTurnAccumMs(),
    draftTurnSliceStartedAt: null,
  }
  return withBestLineupBenchRule(base)
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'game/reset': {
      return createInitialGameState()
    }
    case 'setup/setMode': {
      if (state.phase !== 'setup') return state
      return { ...state, mode: action.mode }
    }
    case 'setup/setCpuDifficultyForTeam': {
      if (state.phase !== 'setup') return state
      return withBestLineupBenchRule({
        ...state,
        cpuDifficultyByTeam: {
          ...state.cpuDifficultyByTeam,
          [action.team]: action.difficulty,
        },
      })
    }
    case 'setup/setTeamCount': {
      if (state.phase !== 'setup') return state
      const count = action.count
      if (count === 1) {
        const order: TeamId[] = ['team1', 'team2']
        const teams = dedupeColorSchemesForActiveOrder(state.teams, order)
        return withBestLineupBenchRule({
          ...state,
          gameKind: 'vsCpu',
          teamOrder: order,
          turn: order[0] ?? 'team1',
          teamControllers: { ...state.teamControllers, team1: 'human', team2: 'cpu' },
          teams,
        })
      }
      const nextOrder = teamOrderForCount(count)
      let teamControllers = state.teamControllers
      if (state.gameKind === 'vsCpu') {
        teamControllers = { ...state.teamControllers, team1: 'human', team2: 'human' }
      }
      const teams = dedupeColorSchemesForActiveOrder(state.teams, nextOrder)
      return withBestLineupBenchRule({
        ...state,
        gameKind: 'multi',
        teamOrder: nextOrder,
        turn: nextOrder[0] ?? 'team1',
        teamControllers,
        teams,
      })
    }
    case 'setup/setTeamController': {
      if (state.phase !== 'setup') return state
      // В режиме vs CPU контроллеры фиксированы.
      if (state.gameKind === 'vsCpu') return state
      // Первая команда всегда "человек" (чтобы была хоть одна управляемая вручную команда в UI).
      if (action.team === 'team1' && action.controller !== 'human') return state
      return withBestLineupBenchRule({
        ...state,
        teamControllers: {
          ...state.teamControllers,
          [action.team]: action.controller,
        },
      })
    }
    case 'setup/setTeamFormation': {
      if (state.formationLocked) return state
      if (state.phase !== 'setup') return state
      const formation = action.formation
      const team = action.team
      return {
        ...state,
        teams: {
          ...state.teams,
          [team]: makeEmptyTeam(team, formation, state.teams[team].name, state.teams[team].colorScheme),
        },
      }
    }
    case 'setup/setTeamColorScheme': {
      if (state.phase !== 'setup') return state
      if (!isPickableColorSchemeId(action.scheme)) return state
      const taken = state.teamOrder.some(
        (tid) => tid !== action.team && state.teams[tid].colorScheme === action.scheme,
      )
      if (taken) return state
      return {
        ...state,
        teams: {
          ...state.teams,
          [action.team]: { ...state.teams[action.team], colorScheme: action.scheme },
        },
      }
    }
    case 'setup/setHintsBudget': {
      if (state.phase !== 'setup') return state
      return { ...state, hintsBudgetPerPlayer: action.budget }
    }
    case 'setup/setRandomPlayerHintsBudget': {
      if (state.phase !== 'setup') return state
      return { ...state, randomPlayerHintsBudgetPerPlayer: action.budget }
    }
    case 'setup/applyDevPreset': {
      if (state.phase !== 'setup') return state
      return withBestLineupBenchRule({
        ...state,
        hintsBudgetPerPlayer: 11,
        randomPlayerHintsBudgetPerPlayer: 11,
      })
    }
    case 'setup/setDevNeuroTeamNameMode': {
      if (state.phase !== 'setup') return state
      return { ...state, devNeuroTeamNameMode: action.mode }
    }
    case 'drawReveal/setTeamName': {
      if (state.phase !== 'drawReveal') return state
      if (!state.teamOrder.includes(action.team)) return state
      const clipped = action.name.length > 48 ? action.name.slice(0, 48) : action.name
      return {
        ...state,
        teams: {
          ...state.teams,
          [action.team]: { ...state.teams[action.team], name: clipped },
        },
      }
    }
    case 'drawReveal/setTeamColorScheme': {
      if (state.phase !== 'drawReveal') return state
      if (!state.teamOrder.includes(action.team)) return state
      if (!isPickableColorSchemeId(action.scheme)) return state
      const taken = state.teamOrder.some(
        (tid) => tid !== action.team && state.teams[tid].colorScheme === action.scheme,
      )
      if (taken) return state
      return {
        ...state,
        teams: {
          ...state.teams,
          [action.team]: { ...state.teams[action.team], colorScheme: action.scheme },
        },
      }
    }
    case 'drawReveal/seedCpuTeamNames': {
      if (state.phase !== 'drawReveal') return state
      return seedCpuNeuroBaseNames(state)
    }
    case 'setup/start': {
      const setupState = withBestLineupBenchRule(state)

      const chaosPicks =
        setupState.mode === 'chaos' ? pickRandomUnique(buildChaosDraftPool(), setupState.maxRounds) : null
      const items =
        chaosPicks != null
          ? chaosPicks.map((p) => p.label)
          : setupState.mode === 'rpl'
            ? pickRandomUnique(RPL_CLUBS, setupState.maxRounds)
            : setupState.mode === 'clubs'
              ? pickRandomUnique(TOP_50_EURO_CLUBS, setupState.maxRounds)
              : setupState.mode === 'nationalTop15'
                ? pickRandomUnique(TOP_15_FOOTBALL_COUNTRIES_RU, setupState.maxRounds)
                : pickRandomUnique(TOP_30_FOOTBALL_COUNTRIES_RU, setupState.maxRounds)
      const chaosKindsAll =
        chaosPicks != null ? chaosPicks.map((p) => p.kind) : ([] as GameState['chaosDraftSourceKindsAll'])
      const chaosKindsRemaining =
        chaosPicks != null ? [...chaosKindsAll] : ([] as GameState['chaosDraftSourceKindsRemaining'])
      const order: TeamId[] =
        setupState.teamOrder.length > 0 ? setupState.teamOrder : (['team1', 'team2'] as TeamId[])

      const n = order.length
      // В vsCPU оставляем прежнее поведение (CPU ходит вторым в раунде 1),
      // в остальных случаях — случайный стартовый сдвиг.
      const draftTurnOrderBase = setupState.gameKind === 'vsCpu' ? 0 : n > 0 ? Math.floor(Math.random() * n) : 0
      const hintBudget = setupState.hintsBudgetPerPlayer
      const randomPlayerHintBudget = setupState.randomPlayerHintsBudgetPerPlayer

      const placeholderFormation: FormationId = '1-4-3-3'
      const nextTeams: GameState['teams'] = { ...setupState.teams }
      for (const teamId of order) {
        const prev = setupState.teams[teamId]
        // Схему выбирают после драфта тренеров; до этого — общий плейсхолдер.
        nextTeams[teamId] = makeEmptyTeam(teamId, placeholderFormation, prev.name, prev.colorScheme)
      }
      const common = {
        ...setupState,
        formationLocked: false,
        draftTurnOrderBase,
        hintsRemaining: createHintsRemaining(hintBudget),
        hintUsedThisRound: createHintUsedThisRound(),
        randomPlayerHintsRemaining: createRandomPlayerHintsRemaining(
          setupState.mode === 'nationalTop15' ||
            setupState.mode === 'nationalTop30' ||
            setupState.mode === 'rpl' ||
            setupState.mode === 'clubs' ||
            setupState.mode === 'chaos'
            ? randomPlayerHintBudget
            : 0,
        ),
        randomPlayerHintError: null,
        countriesAll: items,
        countriesRemaining: items,
        chaosDraftSourceKindsAll: chaosKindsAll,
        chaosDraftSourceKindsRemaining: chaosKindsRemaining,
        currentCountry: null,
        currentDraftSourceKind: null,
        roundIndex: 0,
        turn: order[0] ?? 'team1',
        teams: nextTeams,
        draftTimerStartedAt: null,
        draftTimerPausedAt: null,
        draftTimerPausedAccumMs: 0,

        draftTurnAccumMs: emptyDraftTurnAccumMs(),
        draftTurnSliceStartedAt: null,
      }
      return {
        ...common,
        phase: 'drawReveal',
        coachDraft: null,
        formationPick: null,
        captainPick: null,
        devToolsEnabled: action.devToolsEnabled ?? false,
      }
    }
    case 'formationPick/selectFormation': {
      if (state.phase !== 'formationPick' || !state.formationPick) return state
      const order = state.teamOrder
      const idx = state.formationPick.activeIndex
      const teamId = order[idx]
      if (!teamId) return state
      const prev = state.teams[teamId]
      const nextTeam = rebuildTeamWithFormation(prev, action.formation)
      const nextTeams = { ...state.teams, [teamId]: nextTeam }
      const nextIdx = idx + 1
      if (nextIdx >= order.length) {
        return beginDraftingPhase({
          ...state,
          formationPick: null,
          formationLocked: true,
          teams: nextTeams,
          turn: order[0] ?? 'team1',
        })
      }
      return {
        ...state,
        teams: nextTeams,
        formationPick: { activeIndex: nextIdx },
      }
    }
    case 'coachDraft/toggleEliminate': {
      if (state.phase !== 'coachDraft' || !state.coachDraft) return state
      const cd = state.coachDraft
      if (cd.step !== 'eliminate') return state
      const order = state.teamOrder
      const victim = coachDraftVictimAtStep(order, cd.eliminationStepIndex)
      const victimPool = cd.pools[victim]
      if (!victimPool.some((c) => c.id === action.coachId)) return state
      const pending = cd.pendingEliminateIds
      const has = pending.includes(action.coachId)
      let nextPending: string[]
      if (has) {
        nextPending = pending.filter((id) => id !== action.coachId)
      } else {
        nextPending = [action.coachId]
      }
      return {
        ...state,
        coachDraft: { ...cd, pendingEliminateIds: nextPending },
      }
    }
    case 'coachDraft/confirmEliminate': {
      if (state.phase !== 'coachDraft' || !state.coachDraft) return state
      const cd = state.coachDraft
      if (cd.step !== 'eliminate') return state
      if (cd.pendingEliminateIds.length !== 1) return state
      const order = state.teamOrder
      const victim = coachDraftVictimAtStep(order, cd.eliminationStepIndex)
      const victimPool = cd.pools[victim]
      const removeId = cd.pendingEliminateIds[0]!
      if (!victimPool.some((c) => c.id === removeId)) return state
      const nextPool = victimPool.filter((c) => c.id !== removeId)
      if (nextPool.length < 2) return state
      const nextPools = { ...cd.pools, [victim]: nextPool }
      const nextStep = cd.eliminationStepIndex + 1
      const totalSteps = coachDraftEliminationTotalSteps(order.length)
      if (nextStep >= totalSteps) {
        return {
          ...state,
          coachDraft: {
            ...cd,
            step: 'pick',
            pools: nextPools,
            pendingEliminateIds: [],
            activeIndex: 0,
            eliminationStepIndex: nextStep,
          },
        }
      }
      return {
        ...state,
        coachDraft: {
          ...cd,
          pools: nextPools,
          pendingEliminateIds: [],
          eliminationStepIndex: nextStep,
        },
      }
    }
    case 'coachDraft/eliminateCoach': {
      if (state.phase !== 'coachDraft' || !state.coachDraft) return state
      const cd = state.coachDraft
      if (cd.step !== 'eliminate') return state
      const order = state.teamOrder
      const victim = coachDraftVictimAtStep(order, cd.eliminationStepIndex)
      const victimPool = cd.pools[victim]
      const removeId = action.coachId
      if (!victimPool.some((c) => c.id === removeId)) return state
      const nextPool = victimPool.filter((c) => c.id !== removeId)
      if (nextPool.length < 2) return state
      const nextPools = { ...cd.pools, [victim]: nextPool }
      const nextStep = cd.eliminationStepIndex + 1
      const totalSteps = coachDraftEliminationTotalSteps(order.length)
      if (nextStep >= totalSteps) {
        return {
          ...state,
          coachDraft: {
            ...cd,
            step: 'pick',
            pools: nextPools,
            pendingEliminateIds: [],
            activeIndex: 0,
            eliminationStepIndex: nextStep,
          },
        }
      }
      return {
        ...state,
        coachDraft: {
          ...cd,
          pools: nextPools,
          pendingEliminateIds: [],
          eliminationStepIndex: nextStep,
        },
      }
    }
    case 'coachDraft/selectFinalCoach': {
      if (state.phase !== 'coachDraft' || !state.coachDraft) return state
      const cd = state.coachDraft
      if (cd.step !== 'pick') return state
      const order = state.teamOrder
      const teamId = order[cd.activeIndex]
      if (!teamId) return state
      const pool = cd.pools[teamId]
      const coach = pool.find((c) => c.id === action.coachId)
      if (!coach) return state
      const nextTeams = {
        ...state.teams,
        [teamId]: { ...state.teams[teamId], coach },
      }
      const nextActive = cd.activeIndex + 1
      if (nextActive >= order.length) {
        return {
          ...state,
          phase: 'formationPick',
          coachDraft: null,
          formationPick: { activeIndex: 0 },
          captainPick: null,
          teams: nextTeams,
          turn: order[0] ?? 'team1',
        }
      }
      return {
        ...state,
        teams: nextTeams,
        coachDraft: {
          ...cd,
          pools: { ...cd.pools, [teamId]: [] },
          activeIndex: nextActive,
          eliminationStepIndex: 0,
          pendingEliminateIds: [],
        },
      }
    }
    case 'drawReveal/continue': {
      if (state.phase !== 'drawReveal') return state
      if (!canAdvanceFromDrawRevealIdentity(state)) return state
      const order = state.teamOrder
      const allHaveCoaches = order.every((id) => state.teams[id].coach != null)
      if (!allHaveCoaches) {
        return {
          ...state,
          phase: 'coachDraft',
          formationPick: null,
          captainPick: null,
          coachDraft: buildInitialCoachDraftState(order, state.mode, {
            gameKind: state.gameKind,
            cpuDifficultyByTeam: state.cpuDifficultyByTeam,
            teamControllers: state.teamControllers,
          }),
        }
      }
      return beginDraftingPhase(state)
    }
    case 'draft/setDraftTimerPaused': {
      if (state.phase !== 'drafting') return state
      if (action.paused) {
        if (state.draftTimerPausedAt != null) return state
        const now = Date.now()
        const flushed = commitCurrentTurnSlice(state, now)
        return { ...flushed, draftTimerPausedAt: now }
      }
      if (state.draftTimerPausedAt == null) return state
      const now = Date.now()
      const delta = now - state.draftTimerPausedAt
      return openCurrentTurnSlice(
        {
          ...state,
          draftTimerPausedAt: null,
          draftTimerPausedAccumMs: state.draftTimerPausedAccumMs + delta,
        },
        now,
      )
    }
    case 'draft/useBestLineupHint': {
      if (state.phase !== 'drafting') return state
      if (!supportsBestLineupHint(state.mode)) return state
      if (state.hintsBudgetPerPlayer <= 0) return state
      if (!state.teamOrder.includes(action.team)) return state
      if (state.hintsRemaining[action.team] <= 0) return state
      if (state.hintUsedThisRound[action.team]) return state
      return {
        ...state,
        hintsRemaining: {
          ...state.hintsRemaining,
          [action.team]: state.hintsRemaining[action.team] - 1,
        },
        hintUsedThisRound: {
          ...state.hintUsedThisRound,
          [action.team]: true,
        },
      }
    }
    case 'draft/clearRandomPlayerHintError': {
      if (state.randomPlayerHintError == null) return state
      return { ...state, randomPlayerHintError: null }
    }
    case 'draft/setPickPlayerName': {
      if (state.phase !== 'drafting') return state
      const team = state.teams[action.team]
      let existing = team.picksBySlotId[action.slotId]
      if (!existing) {
        const created = slotPickForFormationSlot(team, action.slotId)
        if (!created) return state
        existing = created
      }

      const trimmed = action.playerName.trim()
      const sourceForResolve = (existing.country ?? state.currentCountry ?? '').trim()
      const resolvedStars =
        trimmed.length === 0
          ? null
          : resolvePlayerStarsForDraftedName({
              mode: state.mode,
              draftSourceKind: state.currentDraftSourceKind,
              sourceLabel: sourceForResolve,
              slotLabel: existing.label,
              playerName: trimmed,
            })
      // Не сбрасываем country при пустом имени: при наборе текста имя временно пустое,
      // иначе клуб/страна драфта теряются до следующего сохранения.
      const nextPick: SlotPick =
        trimmed.length === 0
          ? { ...existing, playerName: null, country: existing.country, playerStars: null }
          : { ...existing, playerName: trimmed, country: existing.country, playerStars: resolvedStars }

      const nextTeam: TeamState = {
        ...team,
        picksBySlotId: {
          ...team.picksBySlotId,
          [action.slotId]: nextPick,
        },
      }

      const nextState: GameState = {
        ...state,
        teams: { ...state.teams, [action.team]: nextTeam },
      }

      if (allActiveTeamsFull(nextState)) {
        const now = Date.now()
        const clocked = commitCurrentTurnSlice(state, now)
        return beginCaptainPickPhase({
          ...clocked,
          teams: nextState.teams,
        })
      }

      return nextState
    }
    case 'draft/useRandomPlayerHint': {
      if (state.phase !== 'drafting') return state
      if (state.randomPlayerHintsBudgetPerPlayer <= 0) return state
      if (
        state.mode !== 'nationalTop15' &&
        state.mode !== 'nationalTop30' &&
        state.mode !== 'rpl' &&
        state.mode !== 'clubs' &&
        state.mode !== 'chaos'
      )
        return state
      if (state.turn !== action.team) return state
      if (!state.currentCountry) return state
      if (!state.teamOrder.includes(action.team)) return state

      const remaining = state.randomPlayerHintsRemaining[action.team] ?? 0
      if (remaining <= 0) return state

      const team = state.teams[action.team]
      const existing = team.picksBySlotId[action.slotId]
      if (!existing) return state
      if (existing.playerName) return state

      const position = existing.label
      const usedNames = existingPickedPlayerNames(state)
      const chaosKind: DraftSourceKind | null = state.mode === 'chaos' ? (state.currentDraftSourceKind ?? null) : null
      const effectiveMode: GameMode =
        state.mode === 'chaos'
          ? chaosKind === 'rplClub'
            ? 'rpl'
            : chaosKind === 'club'
              ? 'clubs'
              : 'nationalTop30'
          : state.mode

      const picked =
        effectiveMode === 'nationalTop15'
          ? pickRandomTop15Player({
              country: state.currentCountry,
              position,
              usedPlayerNames: usedNames,
            })
          : effectiveMode === 'nationalTop30'
            ? pickRandomTop30Player({
                country: state.currentCountry,
                position,
                usedPlayerNames: usedNames,
              })
            : effectiveMode === 'rpl'
              ? pickRandomRplPlayer({
                  club: state.currentCountry,
                  position,
                  usedPlayerNames: usedNames,
                })
              : pickRandomEuroClubPlayer({
                  club: state.currentCountry,
                  position,
                  usedPlayerNames: usedNames,
                })

      if (!picked) {
        return {
          ...state,
          randomPlayerHintsRemaining: {
            ...state.randomPlayerHintsRemaining,
            [action.team]: remaining - 1,
          },
          randomPlayerHintError: { team: action.team, sourceLabel: state.currentCountry, position },
        }
      }

      const nextTeam: TeamState = {
        ...team,
        picksBySlotId: {
          ...team.picksBySlotId,
          [action.slotId]: {
            ...existing,
            playerName: picked.playerName,
            country: state.currentCountry,
            playerStars: picked.stars,
            pickedBy: 'human',
          },
        },
      }

      const now = Date.now()
      const clocked = commitCurrentTurnSlice(state, now)
      const nextState: GameState = {
        ...clocked,
        formationLocked: true,
        randomPlayerHintsRemaining: {
          ...clocked.randomPlayerHintsRemaining,
          [action.team]: remaining - 1,
        },
        randomPlayerHintError: null,
        teams: { ...clocked.teams, [action.team]: nextTeam },
      }

      if (allActiveTeamsFull(nextState)) {
        return beginCaptainPickPhase({ ...nextState, draftTurnSliceStartedAt: null })
      }

      const orderThisRound = roundTurnOrder(
        nextState.teamOrder,
        nextState.draftTurnOrderBase,
        nextState.roundIndex,
      )
      const nextTurn = nextTeamId(action.team, orderThisRound)
      const first = orderThisRound[0] ?? nextTurn
      if (nextTurn !== first) {
        return openCurrentTurnSlice({ ...nextState, turn: nextTurn }, now)
      }

      // last team confirmed: advance to next item and back to first team of the new round
      const advanced = drawNextCountry({ ...nextState, turn: first })
      if (!advanced.currentCountry) {
        return beginCaptainPickPhase({ ...advanced, draftTurnSliceStartedAt: null })
      }
      const firstNextRound = roundTurnOrder(
        advanced.teamOrder,
        advanced.draftTurnOrderBase,
        advanced.roundIndex,
      )[0]
      return openCurrentTurnSlice({ ...advanced, turn: firstNextRound ?? advanced.turn }, now)
    }
    case 'draft/confirmPick': {
      if (state.phase !== 'drafting') return state
      if (state.turn !== action.team) return state
      if (!state.currentCountry) return state
      if (!state.teamOrder.includes(action.team)) return state

      const playerName = action.playerName.trim()
      if (playerName.length === 0) return state

      const team = state.teams[action.team]
      const existing = team.picksBySlotId[action.slotId]
      if (!existing) return state
      if (existing.playerName) return state

      const nextTeam: TeamState = {
        ...team,
        picksBySlotId: {
          ...team.picksBySlotId,
          [action.slotId]: {
            ...existing,
            playerName,
            country: state.currentCountry,
            playerStars:
              action.pickedBy === 'cpu'
                ? action.playerStars ?? null
                : resolvePlayerStarsForDraftedName({
                    mode: state.mode,
                    draftSourceKind: state.currentDraftSourceKind,
                    sourceLabel: state.currentCountry,
                    slotLabel: existing.label,
                    playerName,
                  }),
            pickedBy: action.pickedBy ?? 'human',
          },
        },
      }

      const now = Date.now()
      const clocked = commitCurrentTurnSlice(state, now)
      const nextState: GameState = {
        ...clocked,
        formationLocked: true,
        teams: { ...clocked.teams, [action.team]: nextTeam },
      }

      if (allActiveTeamsFull(nextState)) {
        return beginCaptainPickPhase({ ...nextState, draftTurnSliceStartedAt: null })
      }

      const orderThisRound = roundTurnOrder(
        nextState.teamOrder,
        nextState.draftTurnOrderBase,
        nextState.roundIndex,
      )
      const nextTurn = nextTeamId(action.team, orderThisRound)
      const first = orderThisRound[0] ?? nextTurn
      if (nextTurn !== first) {
        return openCurrentTurnSlice({ ...nextState, turn: nextTurn }, now)
      }

      // last team confirmed: advance to next item and back to first team of the new round
      const advanced = drawNextCountry({ ...nextState, turn: first })
      if (!advanced.currentCountry) {
        return beginCaptainPickPhase({ ...advanced, draftTurnSliceStartedAt: null })
      }
      const firstNextRound = roundTurnOrder(
        advanced.teamOrder,
        advanced.draftTurnOrderBase,
        advanced.roundIndex,
      )[0]
      return openCurrentTurnSlice({ ...advanced, turn: firstNextRound ?? advanced.turn }, now)
    }
    case 'captainPick/selectCaptain': {
      if (state.phase !== 'captainPick' || !state.captainPick) return state
      const order = state.teamOrder
      const idx = state.captainPick.activeIndex
      if (idx < 0 || idx >= order.length) return state
      const tid = order[idx]!
      if (tid !== action.team) return state
      if (isCpuControlledTeam(state, tid)) return state
      const team = state.teams[tid]
      const pick = team.picksBySlotId[action.slotId]
      if (!pick?.playerName) return state
      if (!slotPickForFormationSlot(team, action.slotId)) return state

      const nextTeams: GameState['teams'] = {
        ...state.teams,
        [tid]: { ...team, captainSlotId: action.slotId },
      }
      const afterAssign: GameState = {
        ...state,
        teams: nextTeams,
        captainPick: { activeIndex: idx + 1 },
      }
      return advanceCaptainPickAfterSelection(afterAssign, idx + 1)
    }
    default:
      return state
  }
}

