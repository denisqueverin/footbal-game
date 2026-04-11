import { useCallback, useEffect, useReducer, useRef } from 'react';

import type { FormationId } from '@/entities/game/core/formations';
import { createInitialGameState, gameReducer } from '@/entities/game/core/reducer';
import type {
  ColorSchemeId,
  CpuDifficulty,
  GameMode,
  HintsBudget,
  RandomPlayerHintsBudget,
  TeamCount,
  TeamController,
  TeamId,
} from '@/entities/game/core/types';

import { CoachDraftPage } from '@/pages/coach-draft-page/CoachDraftPage';
import { FormationPickPage } from '@/pages/formation-pick-page/FormationPickPage';
import { DrawRevealPage } from '@/pages/draw-reveal-page';
import { GamePage } from '@/pages/game-page';
import { ResultPage } from '@/pages/result-page';
import { SetupPage } from '@/pages/setup-page';

import { clearGameStorage, loadPersistedGameState, saveGameState } from '@/shared/lib/gameStorage';

export function App() {
  const skipNextPersistRef = useRef(false);

  const [state, dispatch] = useReducer(gameReducer, undefined, () => {
    return loadPersistedGameState() ?? createInitialGameState();
  });

  useEffect(() => {
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }

    saveGameState(state);
  }, [state]);

  const handleSetupSetMode = useCallback((mode: GameMode) => {
    dispatch({ type: 'setup/setMode', mode });
  }, []);

  const handleSetupSetCpuDifficultyForTeam = useCallback((team: TeamId, difficulty: CpuDifficulty) => {
    dispatch({ type: 'setup/setCpuDifficultyForTeam', team, difficulty });
  }, []);

  const handleSetupSetTeamCount = useCallback((count: TeamCount) => {
    dispatch({ type: 'setup/setTeamCount', count });
  }, []);

  const handleSetupSetTeamController = useCallback((team: TeamId, controller: TeamController) => {
    dispatch({ type: 'setup/setTeamController', team, controller });
  }, []);

  const handleSetupSetTeamColorScheme = useCallback((team: TeamId, scheme: ColorSchemeId) => {
    dispatch({ type: 'setup/setTeamColorScheme', team, scheme });
  }, []);

  const handleSetupSetHintsBudget = useCallback((budget: HintsBudget) => {
    dispatch({ type: 'setup/setHintsBudget', budget });
  }, []);

  const handleSetupSetRandomPlayerHintsBudget = useCallback((budget: RandomPlayerHintsBudget) => {
    dispatch({ type: 'setup/setRandomPlayerHintsBudget', budget });
  }, []);

  const handleSetupApplyDevPreset = useCallback(() => {
    dispatch({ type: 'setup/applyDevPreset' });
  }, []);

  const handleSetupStart = useCallback(() => {
    dispatch({ type: 'setup/start' });
  }, []);

  const handleGameReset = useCallback(() => {
    skipNextPersistRef.current = true;
    clearGameStorage();
    dispatch({ type: 'game/reset' });
  }, []);

  const handleDrawRevealAssignTeamNames = useCallback(() => {
    dispatch({ type: 'drawReveal/assignTeamNames' });
  }, []);

  const handleDrawRevealContinue = useCallback(() => {
    dispatch({ type: 'drawReveal/continue' });
  }, []);

  const handleCoachDraftEliminateCoach = useCallback((coachId: string) => {
    dispatch({ type: 'coachDraft/eliminateCoach', coachId });
  }, []);

  const handleCoachDraftSelectFinalCoach = useCallback((coachId: string) => {
    dispatch({ type: 'coachDraft/selectFinalCoach', coachId });
  }, []);

  const handleFormationPickSelect = useCallback((formation: FormationId) => {
    dispatch({ type: 'formationPick/selectFormation', formation });
  }, []);

  const handleDraftConfirmPick = useCallback(
    (
      team: TeamId,
      slotId: string,
      playerName: string,
      playerStars?: 1 | 2 | 3 | 4 | 5 | null,
      pickedBy?: 'human' | 'cpu' | null,
    ) => {
      dispatch({ type: 'draft/confirmPick', team, slotId, playerName, playerStars, pickedBy });
    },
    [],
  );

  const handleSetDraftTimerPaused = useCallback((paused: boolean) => {
    dispatch({ type: 'draft/setDraftTimerPaused', paused });
  }, []);

  const handleSetPickPlayerName = useCallback((team: TeamId, slotId: string, playerName: string) => {
    dispatch({ type: 'draft/setPickPlayerName', team, slotId, playerName });
  }, []);

  const handleUseBestLineupHint = useCallback((team: TeamId) => {
    dispatch({ type: 'draft/useBestLineupHint', team });
  }, []);

  const handleUseRandomPlayerHint = useCallback((team: TeamId, slotId: string) => {
    dispatch({ type: 'draft/useRandomPlayerHint', team, slotId });
  }, []);

  const handleClearRandomPlayerHintError = useCallback(() => {
    dispatch({ type: 'draft/clearRandomPlayerHintError' });
  }, []);

  if (state.phase === 'setup') {
    return (
      <SetupPage
        teamOrder={state.teamOrder}
        teams={state.teams}
        mode={state.mode}
        gameKind={state.gameKind}
        cpuDifficultyByTeam={state.cpuDifficultyByTeam}
        teamControllers={state.teamControllers}
        onSetTeamController={handleSetupSetTeamController}
        onSetTeamColorScheme={handleSetupSetTeamColorScheme}
        onSetTeamCount={handleSetupSetTeamCount}
        onSetMode={handleSetupSetMode}
        onSetCpuDifficultyForTeam={handleSetupSetCpuDifficultyForTeam}
        hintsBudget={state.hintsBudgetPerPlayer}
        onSetHintsBudget={handleSetupSetHintsBudget}
        randomPlayerHintsBudget={state.randomPlayerHintsBudgetPerPlayer}
        onSetRandomPlayerHintsBudget={handleSetupSetRandomPlayerHintsBudget}
        onApplyDevPreset={handleSetupApplyDevPreset}
        onStart={handleSetupStart}
      />
    );
  }

  if (state.phase === 'finished') {
    return <ResultPage state={state} onReset={handleGameReset} />;
  }

  if (state.phase === 'drawReveal') {
    return (
      <DrawRevealPage
        state={state}
        onAssignTeamNames={handleDrawRevealAssignTeamNames}
        onContinue={handleDrawRevealContinue}
        onReset={handleGameReset}
        continueButtonLabel={
          state.teamOrder.every((id) => !state.teams[id].coach)
            ? 'Перейти к выбору тренера'
            : undefined
        }
      />
    );
  }

  if (state.phase === 'coachDraft') {
    return (
      <CoachDraftPage
        state={state}
        onEliminateCoach={handleCoachDraftEliminateCoach}
        onSelectFinalCoach={handleCoachDraftSelectFinalCoach}
        onReset={handleGameReset}
      />
    );
  }

  if (state.phase === 'formationPick') {
    return (
      <FormationPickPage
        state={state}
        onSelectFormation={handleFormationPickSelect}
        onReset={handleGameReset}
      />
    );
  }

  return (
    <GamePage
      state={state}
      onConfirmPick={handleDraftConfirmPick}
      onReset={handleGameReset}
      onSetDraftTimerPaused={handleSetDraftTimerPaused}
      onSetPickPlayerName={handleSetPickPlayerName}
      onUseBestLineupHint={handleUseBestLineupHint}
      onUseRandomPlayerHint={handleUseRandomPlayerHint}
      onClearRandomPlayerHintError={handleClearRandomPlayerHintError}
    />
  );
}
