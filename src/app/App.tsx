import { useCallback, useEffect, useReducer, useRef } from 'react';

import type { FormationId } from '@/entities/game/formations';
import { createInitialGameState, gameReducer } from '@/entities/game/reducer';
import type { ColorSchemeId, GameMode, HintsBudget, TeamCount, TeamId } from '@/entities/game/types';

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

  const handleSetupSetTeamCount = useCallback((count: TeamCount) => {
    dispatch({ type: 'setup/setTeamCount', count });
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

  const handleDraftConfirmPick = useCallback((team: TeamId, slotId: string, playerName: string) => {
    dispatch({ type: 'draft/confirmPick', team, slotId, playerName });
  }, []);

  const handleSetDraftTimerPaused = useCallback((paused: boolean) => {
    dispatch({ type: 'draft/setDraftTimerPaused', paused });
  }, []);

  const handleSetPickPlayerName = useCallback((team: TeamId, slotId: string, playerName: string) => {
    dispatch({ type: 'draft/setPickPlayerName', team, slotId, playerName });
  }, []);

  const handleUseBestLineupHint = useCallback((team: TeamId) => {
    dispatch({ type: 'draft/useBestLineupHint', team });
  }, []);

  if (state.phase === 'setup') {
    return (
      <SetupPage
        formationLocked={state.formationLocked}
        teamOrder={state.teamOrder}
        teams={state.teams}
        mode={state.mode}
        onSetTeamFormation={handleSetupSetTeamFormation}
        onSetTeamColorScheme={handleSetupSetTeamColorScheme}
        onSetTeamCount={handleSetupSetTeamCount}
        onSetMode={handleSetupSetMode}
        hintsBudget={state.hintsBudgetPerPlayer}
        onSetHintsBudget={handleSetupSetHintsBudget}
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
    />
  );
}
