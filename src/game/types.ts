import type { FormationId } from './formations'

export type TeamId = 'team1' | 'team2'

export type GamePhase = 'setup' | 'drafting' | 'finished'

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
  picksBySlotId: Record<string, SlotPick>
}

export type GameState = {
  phase: GamePhase
  formationLocked: boolean

  countriesAll: string[]
  countriesRemaining: string[]
  currentCountry: string | null
  roundIndex: number
  maxRounds: number

  turn: TeamId
  teams: Record<TeamId, TeamState>
}

