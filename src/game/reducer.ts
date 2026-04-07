import { FORMATIONS, type FormationId } from './formations'
import type { GameState, SlotPick, TeamId, TeamState } from './types'
import { drawRandom } from './random'
import { TOP_30_FOOTBALL_COUNTRIES_RU, pickRandomUnique } from './topCountries'

export type GameAction =
  | { type: 'setup/start' }
  | { type: 'setup/setTeamFormation'; team: TeamId; formation: FormationId }
  | { type: 'setup/setTeamName'; team: TeamId; name: string }
  | { type: 'setup/setTeamColor'; team: TeamId; color: string }
  | { type: 'draft/confirmPick'; team: TeamId; slotId: string; playerName: string }
  | { type: 'game/reset' }

function makeEmptyTeam(team: TeamId, formation: FormationId): TeamState {
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
    name: team === 'team1' ? 'Команда 1' : team === 'team2' ? 'Команда 2' : team === 'team3' ? 'Команда 3' : 'Команда 4',
    formation,
    picksBySlotId,
    color: 'green',
  }
}

function isTeamFull(team: TeamState): boolean {
  return Object.values(team.picksBySlotId).every((p) => Boolean(p.playerName))
}

function isAllTeamsFull(state: GameState): boolean {
  return isTeamFull(state.teams.team1) && isTeamFull(state.teams.team2) && isTeamFull(state.teams.team3) && isTeamFull(state.teams.team4)
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

  countriesAll: [],
  countriesRemaining: [],
  currentCountry: null,
  roundIndex: 0,
  maxRounds: 11,

  turn: 'team1',
  teams: {
    team1: makeEmptyTeam('team1', '1-4-3-3'),
    team2: makeEmptyTeam('team2', '1-4-3-3'),
    team3: makeEmptyTeam('team3', '1-4-3-3'),
    team4: makeEmptyTeam('team4', '1-4-3-3'),
  },
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'game/reset': {
      return initialGameState
    }
    case 'setup/setTeamFormation': {
      if (state.formationLocked) return state
      if (state.phase !== 'setup') return state
      const formation = action.formation
      const team = action.team
      return {
        ...state,
        teams: { ...state.teams, [team]: { ...state.teams[team], formation } },
      }
    }
    case 'setup/setTeamName': {
      if (state.phase !== 'setup') return state
      const name = action.name
      const team = action.team
      return {
        ...state,
        teams: { ...state.teams, [team]: { ...state.teams[team], name } },
      }
    }
    case 'setup/setTeamColor': {
      if (state.phase !== 'setup') return state
      const color = action.color
      const team = action.team
      return {
        ...state,
        teams: { ...state.teams, [team]: { ...state.teams[team], color } },
      }
    }
    case 'setup/start': {
      const countries = pickRandomUnique(TOP_30_FOOTBALL_COUNTRIES_RU, state.maxRounds)
      const base: GameState = {
        ...state,
        phase: 'drafting',
        formationLocked: true,
        countriesAll: countries,
        countriesRemaining: countries,
        currentCountry: null,
        roundIndex: 0,
        turn: 'team1',
        teams: {
          team1: makeEmptyTeam('team1', state.teams.team1.formation),
          team2: makeEmptyTeam('team2', state.teams.team2.formation),
          team3: makeEmptyTeam('team3', state.teams.team3.formation),
          team4: makeEmptyTeam('team4', state.teams.team4.formation),
        },
      }
      return drawNextCountry(base)
    }
    case 'draft/confirmPick': {
      if (state.phase !== 'drafting') return state
      if (state.turn !== action.team) return state
      if (!state.currentCountry) return state

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

      if (isAllTeamsFull(nextState)) {
        return { ...nextState, phase: 'finished' }
      }

      if (action.team === 'team1') {
        return { ...nextState, turn: 'team2' };
      } else if (action.team === 'team2') {
        return { ...nextState, turn: 'team3' };
      } else if (action.team === 'team3') {
        return { ...nextState, turn: 'team4' };
      }

      // team4 confirmed: advance to next country and back to team1
      const advanced = drawNextCountry({ ...nextState, turn: 'team1' })
      if (!advanced.currentCountry) {
        return { ...advanced, phase: 'finished' }
      }
      return advanced
    }
    default:
      return state
  }
}

