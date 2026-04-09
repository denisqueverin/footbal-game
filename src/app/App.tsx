import { useCallback, useEffect, useReducer, useRef } from 'react';

import type { FormationId } from '@/entities/game/core/formations';
import { createInitialGameState, gameReducer } from '@/entities/game/core/reducer';
import type {
  ColorSchemeId,
  CpuDifficulty,
  GameKind,
  GameMode,
  HintsBudget,
  RandomPlayerHintsBudget,
  TeamCount,
  TeamController,
  TeamId,
} from '@/entities/game/core/types';

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

  const handleSetupSetGameKind = useCallback((gameKind: GameKind) => {
    dispatch({ type: 'setup/setGameKind', gameKind });
  }, []);

  const handleSetupSetCpuDifficulty = useCallback((difficulty: CpuDifficulty) => {
    dispatch({ type: 'setup/setCpuDifficulty', difficulty });
  }, []);

  const handleSetupSetTeamCount = useCallback((count: TeamCount) => {
    dispatch({ type: 'setup/setTeamCount', count });
  }, []);

  const handleSetupSetTeamController = useCallback((team: TeamId, controller: TeamController) => {
    dispatch({ type: 'setup/setTeamController', team, controller });
  }, []);

  const handleSetupSetTeamFormation = useCallback((team: TeamId, formation: FormationId) => {
    dispatch({ type: 'setup/setTeamFormation', team, formation });
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

  const handleSetupSetBestLineupIncludeBench = useCallback((includeBench: boolean) => {
    dispatch({ type: 'setup/setBestLineupIncludeBench', includeBench });
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
        formationLocked={state.formationLocked}
        teamOrder={state.teamOrder}
        teams={state.teams}
        mode={state.mode}
        gameKind={state.gameKind}
        cpuDifficulty={state.cpuDifficulty}
        teamControllers={state.teamControllers}
        onSetTeamController={handleSetupSetTeamController}
        onSetTeamFormation={handleSetupSetTeamFormation}
        onSetTeamColorScheme={handleSetupSetTeamColorScheme}
        onSetTeamCount={handleSetupSetTeamCount}
        onSetMode={handleSetupSetMode}
        onSetGameKind={handleSetupSetGameKind}
        onSetCpuDifficulty={handleSetupSetCpuDifficulty}
        hintsBudget={state.hintsBudgetPerPlayer}
        onSetHintsBudget={handleSetupSetHintsBudget}
        randomPlayerHintsBudget={state.randomPlayerHintsBudgetPerPlayer}
        onSetRandomPlayerHintsBudget={handleSetupSetRandomPlayerHintsBudget}
        bestLineupIncludeBench={state.bestLineupIncludeBench}
        onSetBestLineupIncludeBench={handleSetupSetBestLineupIncludeBench}
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
