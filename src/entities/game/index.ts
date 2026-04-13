export { createInitialGameState, gameReducer } from './core/reducer';
export type { GameAction } from './core/reducer';
export {
  formatTeamDisplayName,
  isChaosMode,
  isClubsMode,
  isCpuControlledTeam,
  isNationalDraftSource,
  isNationalMode,
  isUnfairCpuDifficulty,
  stripNeuroNamePrefix,
  supportsBestLineupHint,
} from './modes/gameMode';
export type {
  CoachAssignment,
  CoachDraftPhaseState,
  FormationPickPhaseState,
  DevNeuroTeamNameMode,
  ColorSchemeId,
  CpuDifficulty,
  CpuDifficultyByTeam,
  DraftSourceKind,
  GameMode,
  GamePhase,
  GameState,
  HintsBudget,
  RandomPlayerHintsBudget,
  TeamCount,
  TeamId,
  TeamState,
} from './core/types';
