export { createInitialGameState, gameReducer } from './core/reducer';
export type { GameAction } from './core/reducer';
export {
  isChaosMode,
  isClubsMode,
  isCpuControlledTeam,
  isNationalDraftSource,
  isNationalMode,
  isUnfairCpuDifficulty,
  supportsBestLineupHint,
} from './modes/gameMode';
export type {
  CoachAssignment,
  CoachDraftPhaseState,
  FormationPickPhaseState,
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
