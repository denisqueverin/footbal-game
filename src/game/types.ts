import type { FormationId } from './formations'

export type TeamId = 'team1' | 'team2' | 'team3' | 'team4'
export type TeamCount = 2 | 3 | 4

export type GamePhase = 'setup' | 'drawReveal' | 'drafting' | 'finished'

export type GameMode = 'national' | 'clubs'

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

  /** Случайное смещение стартового хода в раунде 1 (0 .. teamOrder.length-1). */
  draftTurnOrderBase: number

  countriesAll: string[]
  countriesRemaining: string[]
  currentCountry: string | null
  roundIndex: number
  maxRounds: number

  turn: TeamId
  teams: Record<TeamId, TeamState>
}

