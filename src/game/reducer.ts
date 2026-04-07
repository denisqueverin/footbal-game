import { FORMATIONS, type FormationId } from './formations'
import { TOP_50_EURO_CLUBS } from './topClubs'
import type { ColorSchemeId, GameMode, GameState, SlotPick, TeamCount, TeamId, TeamState } from './types'
import { drawRandom } from './random'
import { TOP_30_FOOTBALL_COUNTRIES_RU, pickRandomUnique } from './topCountries'

export type GameAction =
  | { type: 'setup/start' }
  | { type: 'setup/setMode'; mode: GameMode }
  | { type: 'setup/setTeamCount'; count: TeamCount }
  | { type: 'setup/setTeamFormation'; team: TeamId; formation: FormationId }
  | { type: 'setup/setTeamName'; team: TeamId; name: string }
  | { type: 'setup/setTeamColorScheme'; team: TeamId; scheme: ColorSchemeId }
  | { type: 'draft/confirmPick'; team: TeamId; slotId: string; playerName: string }
  | { type: 'game/reset' }

const ALL_TEAMS: TeamId[] = ['team1', 'team2', 'team3', 'team4']

function teamOrderForCount(count: TeamCount): TeamId[] {
  return ALL_TEAMS.slice(0, count)
}

function fallbackTeamName(team: TeamId): string {
  switch (team) {
    case 'team1':
      return 'Команда 1'
    case 'team2':
      return 'Команда 2'
    case 'team3':
      return 'Команда 3'
    case 'team4':
      return 'Команда 4'
    default:
      return 'Команда'
  }
}

function nextTeamId(current: TeamId, order: TeamId[]): TeamId {
  const idx = order.indexOf(current)
  if (idx < 0) return order[0] ?? current
  return order[(idx + 1) % order.length] ?? current
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
    return { ...state, currentCountry: null }
  }
  if (state.countriesRemaining.length === 0) {
    return { ...state, currentCountry: null }
  }
  const { item, rest } = drawRandom(state.countriesRemaining)
  return {
    ...state,
    currentCountry: item,
    countriesRemaining: rest,
    roundIndex: state.roundIndex + 1,
  }
}

export const initialGameState: GameState = {
  phase: 'setup',
  formationLocked: false,
  teamOrder: ['team1', 'team2'],
  mode: 'national',

  countriesAll: [],
  countriesRemaining: [],
  currentCountry: null,
  roundIndex: 0,
  maxRounds: 11,

  turn: 'team1',
  teams: {
    team1: makeEmptyTeam('team1', '1-4-3-3', 'Команда 1', 'green'),
    team2: makeEmptyTeam('team2', '1-4-3-3', 'Команда 2', 'red'),
    team3: makeEmptyTeam('team3', '1-4-3-3', 'Команда 3', 'blue'),
    team4: makeEmptyTeam('team4', '1-4-3-3', 'Команда 4', 'white'),
  },
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'game/reset': {
      return initialGameState
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
    case 'setup/setTeamName': {
      if (state.phase !== 'setup') return state
      const name = action.name.trim()
      return {
        ...state,
        teams: {
          ...state.teams,
          [action.team]: {
            ...state.teams[action.team],
            name: name.length > 0 ? name : fallbackTeamName(action.team),
          },
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
    case 'setup/start': {
      const items =
        state.mode === 'clubs'
          ? pickRandomUnique(TOP_50_EURO_CLUBS, state.maxRounds)
          : pickRandomUnique(TOP_30_FOOTBALL_COUNTRIES_RU, state.maxRounds)
      const order: TeamId[] =
        state.teamOrder.length > 0 ? state.teamOrder : (['team1', 'team2'] as TeamId[])

      const nextTeams: GameState['teams'] = { ...state.teams }
      for (const teamId of order) {
        const prev = state.teams[teamId]
        nextTeams[teamId] = makeEmptyTeam(teamId, prev.formation, prev.name, prev.colorScheme)
      }
      const base: GameState = {
        ...state,
        phase: 'drafting',
        formationLocked: true,
        countriesAll: items,
        countriesRemaining: items,
        currentCountry: null,
        roundIndex: 0,
        turn: order[0] ?? 'team1',
        teams: nextTeams,
      }
      return drawNextCountry(base)
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

      const nextTurn = nextTeamId(action.team, nextState.teamOrder)
      const first = nextState.teamOrder[0] ?? nextTurn
      if (nextTurn !== first) {
        return { ...nextState, turn: nextTurn }
      }

      // last team confirmed: advance to next item and back to first team
      const advanced = drawNextCountry({ ...nextState, turn: first })
      if (!advanced.currentCountry) {
        return { ...advanced, phase: 'finished' }
      }
      return advanced
    }
    default:
      return state
  }
}

