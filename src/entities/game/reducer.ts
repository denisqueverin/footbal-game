import { FORMATIONS, type FormationId } from './formations'
import { buildChaosDraftPool } from './chaosDraftPool'
import { supportsBestLineupHint } from './gameMode'
import { TOP_50_EURO_CLUBS } from './topClubs'
import { RPL_CLUBS } from './rplClubs'
import type {
  ColorSchemeId,
  GameMode,
  GameState,
  HintsBudget,
  SlotPick,
  TeamCount,
  TeamId,
  TeamState,
} from './types'
import { areTeamNamesPlaceholder, assignRandomTeamNames } from './teamNames'
import { drawRandom } from './random'
import {
  TOP_15_FOOTBALL_COUNTRIES_RU,
  TOP_30_FOOTBALL_COUNTRIES_RU,
  pickRandomUnique,
} from './topCountries'
import { roundTurnOrder } from './turnOrder'

export type GameAction =
  | { type: 'setup/start' }
  | { type: 'drawReveal/assignTeamNames' }
  | { type: 'drawReveal/continue' }
  | { type: 'setup/setMode'; mode: GameMode }
  | { type: 'setup/setTeamCount'; count: TeamCount }
  | { type: 'setup/setTeamFormation'; team: TeamId; formation: FormationId }
  | { type: 'setup/setTeamColorScheme'; team: TeamId; scheme: ColorSchemeId }
  | { type: 'setup/setHintsBudget'; budget: HintsBudget }
  | { type: 'setup/setBestLineupIncludeBench'; includeBench: boolean }
  | { type: 'draft/confirmPick'; team: TeamId; slotId: string; playerName: string }
  | { type: 'draft/setDraftTimerPaused'; paused: boolean }
  | { type: 'draft/setPickPlayerName'; team: TeamId; slotId: string; playerName: string }
  | { type: 'draft/useBestLineupHint'; team: TeamId }
  | { type: 'game/reset' }

const ALL_TEAMS: TeamId[] = ['team1', 'team2', 'team3', 'team4']

function teamOrderForCount(count: TeamCount): TeamId[] {
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
        }
      }
    }
  }
  return null
}

function createHintsRemaining(budget: number): Record<TeamId, number> {
  return { team1: budget, team2: budget, team3: budget, team4: budget }
}

function createHintUsedThisRound(): Record<TeamId, boolean> {
  return { team1: false, team2: false, team3: false, team4: false }
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
      }
    }
  }
  return {
    id: team,
    name,
    formation,
    colorScheme,
    picksBySlotId,
  }
}

function isTeamFull(team: TeamState): boolean {
  return Object.values(team.picksBySlotId).every((p) => Boolean(p.playerName))
}

function allActiveTeamsFull(state: GameState): boolean {
  return state.teamOrder.every((id) => isTeamFull(state.teams[id]))
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

export function createInitialGameState(): GameState {
  const base: GameState = {
    phase: 'setup',
    formationLocked: false,
    teamOrder: ['team1', 'team2'],
    mode: 'nationalTop30',
    draftTurnOrderBase: 0,

    bestLineupIncludeBench: true,

    hintsBudgetPerPlayer: 1,
    hintsRemaining: createHintsRemaining(1),
    hintUsedThisRound: createHintUsedThisRound(),

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
      team1: makeEmptyTeam('team1', '1-4-3-3', 'Команда 1', 'green'),
      team2: makeEmptyTeam('team2', '1-4-3-3', 'Команда 2', 'red'),
      team3: makeEmptyTeam('team3', '1-4-3-3', 'Команда 3', 'blue'),
      team4: makeEmptyTeam('team4', '1-4-3-3', 'Команда 4', 'white'),
    },

    draftTimerStartedAt: null,
    draftTimerPausedAt: null,
    draftTimerPausedAccumMs: 0,
  }
  return base
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
    case 'setup/setTeamCount': {
      if (state.phase !== 'setup') return state
      const nextOrder = teamOrderForCount(action.count)
      return { ...state, teamOrder: nextOrder, turn: nextOrder[0] ?? 'team1' }
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
    case 'setup/setBestLineupIncludeBench': {
      if (state.phase !== 'setup') return state
      return { ...state, bestLineupIncludeBench: action.includeBench }
    }
    case 'drawReveal/assignTeamNames': {
      if (state.phase !== 'drawReveal') return state
      if (!areTeamNamesPlaceholder(state)) return state
      return assignRandomTeamNames(state)
    }
    case 'setup/start': {
      const chaosPicks =
        state.mode === 'chaos' ? pickRandomUnique(buildChaosDraftPool(), state.maxRounds) : null
      const items =
        chaosPicks != null
          ? chaosPicks.map((p) => p.label)
          : state.mode === 'rpl'
            ? pickRandomUnique(RPL_CLUBS, state.maxRounds)
            : state.mode === 'clubs'
              ? pickRandomUnique(TOP_50_EURO_CLUBS, state.maxRounds)
              : state.mode === 'nationalTop15'
                ? pickRandomUnique(TOP_15_FOOTBALL_COUNTRIES_RU, state.maxRounds)
                : pickRandomUnique(TOP_30_FOOTBALL_COUNTRIES_RU, state.maxRounds)
      const chaosKindsAll =
        chaosPicks != null ? chaosPicks.map((p) => p.kind) : ([] as GameState['chaosDraftSourceKindsAll'])
      const chaosKindsRemaining =
        chaosPicks != null ? [...chaosKindsAll] : ([] as GameState['chaosDraftSourceKindsRemaining'])
      const order: TeamId[] =
        state.teamOrder.length > 0 ? state.teamOrder : (['team1', 'team2'] as TeamId[])

      const n = order.length
      const draftTurnOrderBase = n > 0 ? Math.floor(Math.random() * n) : 0
      const hintBudget = state.hintsBudgetPerPlayer

      const nextTeams: GameState['teams'] = { ...state.teams }
      for (const teamId of order) {
        const prev = state.teams[teamId]
        nextTeams[teamId] = makeEmptyTeam(teamId, prev.formation, prev.name, prev.colorScheme)
      }
      return {
        ...state,
        phase: 'drawReveal',
        formationLocked: true,
        draftTurnOrderBase,
        hintsRemaining: createHintsRemaining(hintBudget),
        hintUsedThisRound: createHintUsedThisRound(),
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
      }
    }
    case 'drawReveal/continue': {
      if (state.phase !== 'drawReveal') return state
      const base: GameState = { ...state, phase: 'drafting' }
      const drawn = drawNextCountry(base)
      if (!drawn.currentCountry) {
        return { ...drawn, phase: 'finished' }
      }
      const first = roundTurnOrder(drawn.teamOrder, drawn.draftTurnOrderBase, drawn.roundIndex)[0]
      const startedAt = drawn.draftTimerStartedAt ?? Date.now()
      return {
        ...drawn,
        turn: first ?? drawn.turn,
        draftTimerStartedAt: startedAt,
        draftTimerPausedAt: null,
        draftTimerPausedAccumMs: drawn.draftTimerPausedAccumMs,
      }
    }
    case 'draft/setDraftTimerPaused': {
      if (state.phase !== 'drafting') return state
      if (action.paused) {
        if (state.draftTimerPausedAt != null) return state
        return { ...state, draftTimerPausedAt: Date.now() }
      }
      if (state.draftTimerPausedAt == null) return state
      const now = Date.now()
      const delta = now - state.draftTimerPausedAt
      return {
        ...state,
        draftTimerPausedAt: null,
        draftTimerPausedAccumMs: state.draftTimerPausedAccumMs + delta,
      }
    }
    case 'draft/useBestLineupHint': {
      if (state.phase !== 'drafting') return state
      if (!supportsBestLineupHint(state.mode)) return state
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
      // Не сбрасываем country при пустом имени: при наборе текста имя временно пустое,
      // иначе клуб/страна драфта теряются до следующего сохранения.
      const nextPick: SlotPick =
        trimmed.length === 0
          ? { ...existing, playerName: null, country: existing.country }
          : { ...existing, playerName: trimmed, country: existing.country }

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
        return { ...nextState, phase: 'finished' }
      }

      return nextState
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
          },
        },
      }

      const nextState: GameState = {
        ...state,
        formationLocked: true,
        teams: { ...state.teams, [action.team]: nextTeam },
      }

      if (allActiveTeamsFull(nextState)) {
        return { ...nextState, phase: 'finished' }
      }

      const orderThisRound = roundTurnOrder(
        nextState.teamOrder,
        nextState.draftTurnOrderBase,
        nextState.roundIndex,
      )
      const nextTurn = nextTeamId(action.team, orderThisRound)
      const first = orderThisRound[0] ?? nextTurn
      if (nextTurn !== first) {
        return { ...nextState, turn: nextTurn }
      }

      // last team confirmed: advance to next item and back to first team of the new round
      const advanced = drawNextCountry({ ...nextState, turn: first })
      if (!advanced.currentCountry) {
        return { ...advanced, phase: 'finished' }
      }
      const firstNextRound = roundTurnOrder(
        advanced.teamOrder,
        advanced.draftTurnOrderBase,
        advanced.roundIndex,
      )[0]
      return { ...advanced, turn: firstNextRound ?? advanced.turn }
    }
    default:
      return state
  }
}

