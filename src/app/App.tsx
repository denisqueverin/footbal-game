import { useCallback, useReducer } from 'react';

import type { FormationId } from '@/entities/game/formations';
import { gameReducer, initialGameState } from '@/entities/game/reducer';
import type { ColorSchemeId, GameMode, TeamCount, TeamId } from '@/entities/game/types';

import { DrawRevealPage } from '@/pages/draw-reveal-page';
import { GamePage } from '@/pages/game-page';
import { ResultPage } from '@/pages/result-page';
import { SetupPage } from '@/pages/setup-page';

export function App() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  const handleSetupSetMode = useCallback((mode: GameMode) => {
    dispatch({ type: 'setup/setMode', mode });
  }, []);

  const handleSetupSetTeamCount = useCallback((count: TeamCount) => {
    dispatch({ type: 'setup/setTeamCount', count });
  }, []);

  const handleSetupSetTeamFormation = useCallback((team: TeamId, formation: FormationId) => {
    dispatch({ type: 'setup/setTeamFormation', team, formation });
  }, []);

  const handleSetupSetTeamName = useCallback((team: TeamId, name: string) => {
    dispatch({ type: 'setup/setTeamName', team, name });
  }, []);

  const handleSetupSetTeamColorScheme = useCallback((team: TeamId, scheme: ColorSchemeId) => {
    dispatch({ type: 'setup/setTeamColorScheme', team, scheme });
  }, []);

  const handleSetupStart = useCallback(() => {
    dispatch({ type: 'setup/start' });
  }, []);

  const handleGameReset = useCallback(() => {
    dispatch({ type: 'game/reset' });
  }, []);

  const handleDrawRevealContinue = useCallback(() => {
    dispatch({ type: 'drawReveal/continue' });
  }, []);

  const handleDraftConfirmPick = useCallback((team: TeamId, slotId: string, playerName: string) => {
    dispatch({ type: 'draft/confirmPick', team, slotId, playerName });
  }, []);

  if (state.phase === 'setup') {
    return (
      <SetupPage
        formationLocked={state.formationLocked}
        teamOrder={state.teamOrder}
        teams={state.teams}
        mode={state.mode}
        onSetTeamFormation={handleSetupSetTeamFormation}
        onSetTeamName={handleSetupSetTeamName}
        onSetTeamColorScheme={handleSetupSetTeamColorScheme}
        onSetTeamCount={handleSetupSetTeamCount}
        onSetMode={handleSetupSetMode}
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
    />
  );
}
