import { useCallback, useEffect, useRef, useState } from 'react';

import { FORMATIONS, formationIdFromCoachPriorityLabel, type FormationId } from '@/entities/game/core/formations';
import type { GameState } from '@/entities/game/core/types';
import { pickCpuFormationForCoach } from '@/entities/game/data/coaches';
import { formationLabelShort } from '@/pages/setup-page/setup-page.utils';
import { APP_VERSION } from '@/shared/config/version';
import { FormationPreview } from '@/shared/ui/formation-preview';
import { CpuDifficultyIcon } from '@/shared/ui/cpu-difficulty-icon';
import { ConfirmNewGameModal } from '@/shared/ui/confirm-new-game-modal';

const CPU_FORMATION_THINK_MS = 900;

export interface FormationPickPageProps {
  state: GameState;
  onSelectFormation: (formation: FormationId) => void;
  onReset: () => void;
}

export function FormationPickPage(props: FormationPickPageProps) {
  const { state } = props;
  const fp = state.formationPick;
  const [resetOpen, setResetOpen] = useState(false);
  const [cpuThinking, setCpuThinking] = useState(false);
  const lockRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const order = state.teamOrder;
  const activeTeam = fp ? order[fp.activeIndex] : null;
  const team = activeTeam ? state.teams[activeTeam] : null;
  const coach = team?.coach ?? null;
  const priorityFormation = coach ? formationIdFromCoachPriorityLabel(coach.priorityFormation) : null;

  const isCpuTurn =
    fp &&
    activeTeam &&
    (state.teamControllers[activeTeam] === 'cpu' || (state.gameKind === 'vsCpu' && activeTeam === 'team2'));

  const displayName =
    activeTeam &&
    (state.teamControllers[activeTeam] === 'cpu' || (state.gameKind === 'vsCpu' && activeTeam === 'team2'))
      ? `Нейро ${team!.name}`
      : team?.name ?? '';

  const handleCpu = useCallback(() => {
    if (!fp || !activeTeam || !isCpuTurn || !team) return;
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const lock = `${fp.activeIndex}-${team.coach?.id ?? 'x'}`;
    if (lockRef.current === lock) return;
    lockRef.current = lock;
    setCpuThinking(true);
    const formation = pickCpuFormationForCoach(team.coach, state.cpuDifficultyByTeam[activeTeam]);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      props.onSelectFormation(formation);
      setCpuThinking(false);
    }, CPU_FORMATION_THINK_MS);
  }, [fp, activeTeam, isCpuTurn, team, state.cpuDifficultyByTeam, props.onSelectFormation]);

  useEffect(() => {
    lockRef.current = null;
    setCpuThinking(false);
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [fp?.activeIndex]);

  useEffect(() => {
    handleCpu();
  }, [handleCpu]);

  useEffect(() => {
    return () => {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  if (!fp || !activeTeam || !team) {
    return null;
  }

  return (
    <div className="formation-pick-page">
      <ConfirmNewGameModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={props.onReset}
      />
      <div className="formation-pick-shell">
        <div className="formation-pick-version">v{APP_VERSION}</div>
        <h1 className="formation-pick-title">Выбор схемы поля</h1>
        <p className="formation-pick-sub">
          <span className="formation-pick-actor">
            {displayName}
            {isCpuTurn ? (
              <CpuDifficultyIcon difficulty={state.cpuDifficultyByTeam[activeTeam]} />
            ) : null}
          </span>
          : выберите расстановку. У тренера <strong>{coach?.name ?? '—'}</strong> приоритетная схема в
          карьере — <strong>{coach?.priorityFormation ?? '—'}</strong>
          {priorityFormation ? ' (совпадает с одной из сеток ниже — отмечена короной).' : ' (нет точного совпадения с доступными сетками).'}
        </p>

        {isCpuTurn && cpuThinking ? (
          <div className="formation-pick-cpu-thinking" aria-live="polite">
            <span className="formation-pick-cpu-spinner" aria-hidden="true" />
            Компьютер выбирает схему…
          </div>
        ) : null}

        <div className="formation-pick-grid">
          {(Object.keys(FORMATIONS) as FormationId[]).map((formationId) => {
            const isPriority = priorityFormation === formationId;
            const canClick = !isCpuTurn;
            return (
              <button
                key={formationId}
                type="button"
                disabled={!canClick}
                onClick={() => canClick && props.onSelectFormation(formationId)}
                className={`formation-pick-cardbtn${isPriority ? ' formation-pick-cardbtn--priority' : ''}`}
              >
                <div className="formation-pick-cardbtn-top">
                  <span className="formation-pick-cardbtn-name">{formationLabelShort(formationId)}</span>
                  {isPriority ? (
                    <span className="formation-pick-crown" title="Приоритетная схема тренера">
                      👑
                    </span>
                  ) : null}
                </div>
                <FormationPreview formation={formationId} />
              </button>
            );
          })}
        </div>

        <div className="formation-pick-foot">
          <button type="button" className="formation-pick-ghost" onClick={() => setResetOpen(true)}>
            Новая игра
          </button>
        </div>
      </div>
    </div>
  );
}
