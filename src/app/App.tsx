import { useCallback, useEffect, useReducer, useRef, type ReactNode } from 'react';

import type { FormationId } from '@/entities/game/core/formations';
import { createInitialGameState, gameReducer } from '@/entities/game/core/reducer';
import type {
  ColorSchemeId,
  CpuDifficulty,
  DevNeuroTeamNameMode,
  GameMode,
  HintsBudget,
  RandomPlayerHintsBudget,
  TeamCount,
  TeamController,
  TeamId,
} from '@/entities/game/core/types';

import { CaptainPickPage } from '@/pages/captain-pick-page/CaptainPickPage';
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

  const handleSetupSetHintsBudget = useCallback((budget: HintsBudget) => {
    dispatch({ type: 'setup/setHintsBudget', budget });
  }, []);

  const handleSetupSetRandomPlayerHintsBudget = useCallback((budget: RandomPlayerHintsBudget) => {
    dispatch({ type: 'setup/setRandomPlayerHintsBudget', budget });
  }, []);

  const handleSetupApplyDevPreset = useCallback(() => {
    dispatch({ type: 'setup/applyDevPreset' });
  }, []);

  const handleSetupSetDevNeuroTeamNameMode = useCallback((mode: DevNeuroTeamNameMode) => {
    dispatch({ type: 'setup/setDevNeuroTeamNameMode', mode });
  }, []);

  const handleSetupStart = useCallback((devToolsEnabled?: boolean) => {
    dispatch({ type: 'setup/start', devToolsEnabled: Boolean(devToolsEnabled) });
  }, []);

  const handleGameReset = useCallback(() => {
    skipNextPersistRef.current = true;
    clearGameStorage();
    dispatch({ type: 'game/reset' });
  }, []);

  const handleDrawRevealSetTeamName = useCallback((team: TeamId, name: string) => {
    dispatch({ type: 'drawReveal/setTeamName', team, name });
  }, []);

  const handleDrawRevealSetTeamColorScheme = useCallback((team: TeamId, scheme: ColorSchemeId) => {
    dispatch({ type: 'drawReveal/setTeamColorScheme', team, scheme });
  }, []);

  const handleDrawRevealSeedCpuTeamNames = useCallback(() => {
    dispatch({ type: 'drawReveal/seedCpuTeamNames' });
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

  const handleCaptainPickSelect = useCallback((team: TeamId, slotId: string) => {
    dispatch({ type: 'captainPick/selectCaptain', team, slotId });
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

  let page: ReactNode;

  if (state.phase === 'setup') {
    page = (
      <SetupPage
        teamOrder={state.teamOrder}
        teams={state.teams}
        mode={state.mode}
        gameKind={state.gameKind}
        cpuDifficultyByTeam={state.cpuDifficultyByTeam}
        teamControllers={state.teamControllers}
        onSetTeamController={handleSetupSetTeamController}
        onSetTeamCount={handleSetupSetTeamCount}
        onSetMode={handleSetupSetMode}
        onSetCpuDifficultyForTeam={handleSetupSetCpuDifficultyForTeam}
        hintsBudget={state.hintsBudgetPerPlayer}
        onSetHintsBudget={handleSetupSetHintsBudget}
        randomPlayerHintsBudget={state.randomPlayerHintsBudgetPerPlayer}
        onSetRandomPlayerHintsBudget={handleSetupSetRandomPlayerHintsBudget}
        onApplyDevPreset={handleSetupApplyDevPreset}
        devNeuroTeamNameMode={state.devNeuroTeamNameMode}
        onSetDevNeuroTeamNameMode={handleSetupSetDevNeuroTeamNameMode}
        onStart={handleSetupStart}
      />
    );
  } else if (state.phase === 'captainPick') {
    page = (
      <CaptainPickPage state={state} onSelectCaptain={handleCaptainPickSelect} onReset={handleGameReset} />
    );
  } else if (state.phase === 'finished') {
    page = <ResultPage state={state} onReset={handleGameReset} />;
  } else if (state.phase === 'drawReveal') {
    page = (
      <DrawRevealPage
        state={state}
        onSetTeamName={handleDrawRevealSetTeamName}
        onSetTeamColorScheme={handleDrawRevealSetTeamColorScheme}
        onSeedCpuTeamNames={handleDrawRevealSeedCpuTeamNames}
        onContinue={handleDrawRevealContinue}
        onReset={handleGameReset}
        continueButtonLabel={
          state.teamOrder.every((id) => !state.teams[id].coach) ? 'Перейти к выбору тренера' : undefined
        }
      />
    );
  } else if (state.phase === 'coachDraft') {
    page = (
      <CoachDraftPage
        state={state}
        onEliminateCoach={handleCoachDraftEliminateCoach}
        onSelectFinalCoach={handleCoachDraftSelectFinalCoach}
        onReset={handleGameReset}
      />
    );
  } else if (state.phase === 'formationPick') {
    page = (
      <FormationPickPage
        state={state}
        onSelectFormation={handleFormationPickSelect}
        onReset={handleGameReset}
      />
    );
  } else {
    page = (
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

  return (
    <>
      <a className="fc-skip-link" href="#main-content">
        К основному содержимому
      </a>
      <main id="main-content" className="fc-app-main" tabIndex={-1}>
        {page}
      </main>
    </>
  );
}
