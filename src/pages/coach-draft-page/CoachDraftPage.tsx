import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  coachDraftEliminationTotalSteps,
  coachDraftPickerAtStep,
  coachDraftVictimAtStep,
} from '@/entities/game/core/coachDraftPhase';
import type { CoachAssignment, GameState, TeamId } from '@/entities/game/core/types';
import { pickCpuEliminateOneCoachId, pickCpuFinalCoachId } from '@/entities/game/data/coaches';
import { formatTeamDisplayName, isCpuControlledTeam } from '@/entities/game/modes/gameMode';
import { getCountryFlagUrlRu } from '@/entities/game/data/topCountries';
import { schemeLabelRu } from '@/shared/lib/schemeAccent';

import { APP_VERSION } from '@/shared/config/version';
import { ConfirmNewGameModal } from '@/shared/ui/confirm-new-game-modal';
import { CpuDifficultyIcon } from '@/shared/ui/cpu-difficulty-icon';
import { KitSchemeIcon } from '@/shared/ui/kit-scheme-icon/KitSchemeIcon';

const CPU_COACH_THINK_MS = 3000;
const CPU_ELIMINATE_HIGHLIGHT_MS = 1000;

/** Стабильная ссылка: иначе `useCallback(handleCpu)` меняется каждый рендер и сбрасывает таймер CPU. */
const EMPTY_COACH_POOL: readonly CoachAssignment[] = [];

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

function coachCardStarTierClass(stars: number): string {
  if (stars === 5) return 'coach-draft-cardbtn--tier-gold';
  if (stars === 4) return 'coach-draft-cardbtn--tier-silver';
  return '';
}

function coachDoneHeadTierClass(stars: number): string {
  if (stars === 5) return 'coach-draft-pool-done-head--tier-gold';
  if (stars === 4) return 'coach-draft-pool-done-head--tier-silver';
  return '';
}

function CoachDraftCardProfile({
  coach,
  variant,
}: {
  coach: CoachAssignment;
  variant: 'eliminate' | 'pick';
}) {
  return (
    <div className="coach-draft-profile">
      <div className="coach-draft-profile-scheme">Приоритетная схема: {coach.priorityFormation}</div>
      {variant === 'pick' ? (
        <>
          <p className="coach-draft-profile-line">
            <span className="coach-draft-profile-label">Сильные стороны:</span> {coach.strengthsRu}
          </p>
          <p className="coach-draft-profile-line">
            <span className="coach-draft-profile-label">Слабые стороны:</span> {coach.weaknessesRu}
          </p>
        </>
      ) : null}
    </div>
  );
}

export interface CoachDraftPageProps {
  state: GameState;
  onEliminateCoach: (coachId: string) => void;
  onSelectFinalCoach: (coachId: string) => void;
  onReset: () => void;
}

export function CoachDraftPage(props: CoachDraftPageProps) {
  const { state } = props;
  const cd = state.coachDraft;
  const [resetOpen, setResetOpen] = useState(false);
  const [cpuThinking, setCpuThinking] = useState(false);
  const [cpuEliminateHighlightCoachId, setCpuEliminateHighlightCoachId] = useState<string | null>(null);
  const cpuLockRef = useRef<string | null>(null);
  const thinkTimerRef = useRef<number | null>(null);

  const order = state.teamOrder;

  const teamCtx = useMemo(
    () => ({
      gameKind: state.gameKind,
      teamOrder: state.teamOrder,
      teamControllers: state.teamControllers,
    }),
    [state.gameKind, state.teamOrder, state.teamControllers],
  );

  const teamLabel = useCallback(
    (tid: TeamId) => formatTeamDisplayName(teamCtx, tid, state.teams[tid].name),
    [teamCtx, state.teams],
  );

  const activeTeam = cd ? order[cd.activeIndex] : null;
  const victimTeam =
    cd && cd.step === 'eliminate' ? coachDraftVictimAtStep(order, cd.eliminationStepIndex) : null;
  const pickerTeam =
    cd && cd.step === 'eliminate' ? coachDraftPickerAtStep(order, cd.eliminationStepIndex) : null;
  const victimPool =
    victimTeam && cd ? (cd.pools[victimTeam] ?? EMPTY_COACH_POOL) : EMPTY_COACH_POOL;
  const isEliminatePickerCpu = Boolean(cd && pickerTeam) && (
    state.gameKind === 'vsCpu' && order.length === 2
      ? pickerTeam === 'team2'
      : state.teamControllers[pickerTeam!] === 'cpu'
  );
  const isCpuTurn =
    cd && cd.step === 'eliminate'
      ? Boolean(pickerTeam) && isEliminatePickerCpu
      : Boolean(
          activeTeam &&
            (state.teamControllers[activeTeam] === 'cpu' ||
              (state.gameKind === 'vsCpu' && activeTeam === 'team2')),
        );

  const pickPool =
    cd && cd.step === 'pick' && activeTeam
      ? (cd.pools[activeTeam] ?? EMPTY_COACH_POOL)
      : EMPTY_COACH_POOL;

  const eliminationStepsPreview = useMemo(() => {
    if (!cd || cd.step !== 'eliminate') return [];
    const n = order.length;
    const steps: { picker: TeamId; victim: TeamId }[] = [];
    const total = coachDraftEliminationTotalSteps(n);
    for (let s = 0; s < total; s++) {
      steps.push({
        picker: coachDraftPickerAtStep(order, s),
        victim: coachDraftVictimAtStep(order, s),
      });
    }
    return steps;
  }, [order, cd?.step]);

  const title =
    cd?.step === 'eliminate'
      ? 'Выбор тренера: по очереди у разных соперников'
      : 'Выбор тренера: финальный выбор';

  const subtitle = useMemo(() => {
    if (!cd) return '';
    if (cd.step === 'eliminate' && victimTeam && pickerTeam) {
      const vName = teamLabel(victimTeam);
      const pName = teamLabel(pickerTeam);
      return `${pName} убирает одного тренера из списка «${vName}» (шаг ${cd.eliminationStepIndex + 1} из ${coachDraftEliminationTotalSteps(order.length)}). Останется двое.`;
    }
    if (cd.step === 'pick' && activeTeam) {
      return `${teamLabel(activeTeam)}: выберите одного тренера из двух — он появится на схеме команды.`;
    }
    return '';
  }, [cd, activeTeam, victimTeam, pickerTeam, teamLabel, order.length]);

  const handleCpu = useCallback(() => {
    if (!cd || !isCpuTurn) return;
    if (cd.step === 'pick' && !activeTeam) return;
    if (thinkTimerRef.current != null) {
      window.clearTimeout(thinkTimerRef.current);
      thinkTimerRef.current = null;
    }
    if (cd.step === 'eliminate' && victimTeam) {
      const lock = `${cd.step}-${cd.eliminationStepIndex}-${victimPool.map((c) => c.id).join(',')}`;
      if (cpuLockRef.current === lock) return;
      cpuLockRef.current = lock;
      const id = pickCpuEliminateOneCoachId(
        victimPool,
        pickerTeam ? state.cpuDifficultyByTeam[pickerTeam] : 'normal',
      );
      setCpuEliminateHighlightCoachId(id);
      thinkTimerRef.current = window.setTimeout(() => {
        thinkTimerRef.current = null;
        setCpuEliminateHighlightCoachId(null);
        props.onEliminateCoach(id);
      }, CPU_ELIMINATE_HIGHLIGHT_MS);
      return;
    }
    if (cd.step === 'pick') {
      const lock = `pick-${cd.activeIndex}-${pickPool.map((c) => c.id).join(',')}`;
      if (cpuLockRef.current === lock) return;
      cpuLockRef.current = lock;
      setCpuThinking(true);
      thinkTimerRef.current = window.setTimeout(() => {
        thinkTimerRef.current = null;
        const id = pickCpuFinalCoachId(
          pickPool,
          activeTeam ? state.cpuDifficultyByTeam[activeTeam] : 'normal',
        );
        props.onSelectFinalCoach(id);
        setCpuThinking(false);
      }, CPU_COACH_THINK_MS);
    }
  }, [
    cd,
    activeTeam,
    isCpuTurn,
    victimTeam,
    victimPool,
    pickPool,
    state.cpuDifficultyByTeam,
    props.onEliminateCoach,
    props.onSelectFinalCoach,
  ]);

  useEffect(() => {
    cpuLockRef.current = null;
    setCpuThinking(false);
    setCpuEliminateHighlightCoachId(null);
    if (thinkTimerRef.current != null) {
      window.clearTimeout(thinkTimerRef.current);
      thinkTimerRef.current = null;
    }
  }, [cd?.step, cd?.eliminationStepIndex]);

  useEffect(() => {
    handleCpu();
  }, [handleCpu]);

  useEffect(() => {
    return () => {
      if (thinkTimerRef.current != null) {
        window.clearTimeout(thinkTimerRef.current);
        thinkTimerRef.current = null;
      }
    };
  }, []);

  if (!cd) {
    return null;
  }

  const fourTeamsLayout = order.length === 4;

  return (
    <div className={`coach-draft-page${fourTeamsLayout ? ' coach-draft-page--four' : ''}`}>
      <ConfirmNewGameModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={props.onReset}
      />
      <div className={`coach-draft-card${fourTeamsLayout ? ' coach-draft-card--four' : ''}`}>
        <div className="coach-draft-topstrip">
          <div className="coach-draft-topstrip-main">
            {cd.step === 'eliminate' && pickerTeam && victimTeam ? (
              <p className="coach-draft-current-pair" aria-live="polite">
                <span className="coach-draft-current-pair-kicker">Сейчас: </span>
                <strong className="coach-draft-current-pair-picker">{teamLabel(pickerTeam)}</strong>
                <span className="coach-draft-current-pair-mid"> убирает у </span>
                <strong className="coach-draft-current-pair-victim">{teamLabel(victimTeam)}</strong>
              </p>
            ) : cd.step === 'pick' ? (
              <p className="coach-draft-current-pair coach-draft-current-pair--muted">
                Финальный выбор тренера по командам
              </p>
            ) : null}
          </div>
          <div className="coach-draft-version">v{APP_VERSION}</div>
        </div>
        <h1 className="coach-draft-title">{title}</h1>
        <p className="coach-draft-sub">{subtitle}</p>

        {isCpuTurn && cpuThinking ? (
          <div className="coach-draft-cpu-thinking" aria-live="polite">
            <span className="coach-draft-cpu-spinner" aria-hidden="true" />
            Компьютер принимает решение…
          </div>
        ) : null}

        {cd.step === 'eliminate' && victimTeam ? (
          <div className="coach-draft-section">
            {eliminationStepsPreview.length > 0 ? (
              <div className="coach-draft-flow" aria-label="Порядок снятия тренеров по шагам">
                <div
                  className="coach-draft-flow-strip"
                  style={
                    {
                      ['--coach-draft-flow-cols' as string]: String(eliminationStepsPreview.length),
                    } as CSSProperties
                  }
                >
                  {eliminationStepsPreview.map((row, sIdx) => {
                    const isCurrent = sIdx === cd.eliminationStepIndex;
                    const pTeam = state.teams[row.picker];
                    const vTeam = state.teams[row.victim];
                    return (
                      <div
                        key={sIdx}
                        className={`coach-draft-flow-slot${isCurrent ? ' coach-draft-flow-slot--current' : ''}`}
                        title={`Шаг ${sIdx + 1}: ${teamLabel(row.picker)} → ${teamLabel(row.victim)}`}
                      >
                        <span className="coach-draft-flow-step-idx">{sIdx + 1}</span>
                        <div className="coach-draft-flow-cell">
                          <span
                            className="coach-draft-flow-pill"
                            title={schemeLabelRu(pTeam.colorScheme)}
                            aria-label={schemeLabelRu(pTeam.colorScheme)}
                          >
                            <KitSchemeIcon schemeId={pTeam.colorScheme} className="coach-draft-flow-kit-icon" />
                          </span>
                          <span className="coach-draft-flow-mid" aria-hidden="true">
                            →
                          </span>
                          <span
                            className="coach-draft-flow-pill coach-draft-flow-pill--victim"
                            title={schemeLabelRu(vTeam.colorScheme)}
                            aria-label={schemeLabelRu(vTeam.colorScheme)}
                          >
                            <KitSchemeIcon schemeId={vTeam.colorScheme} className="coach-draft-flow-kit-icon" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <div className="coach-draft-hint">
              В свой ход нажмите на карточку тренера в колонке соперника с жёлтой обводкой. Очередь соперников
              меняется по кругу (сначала у соседа в списке, затем у следующего и т.д.). У всех команд разные тренеры
              в пулах; сильные и слабые стороны — только на финале.
            </div>
            <div
              className={`coach-draft-pools-row${fourTeamsLayout ? ' coach-draft-pools-row--four' : ''}`}
            >
              {order.map((teamId: TeamId) => {
                const pool = cd.pools[teamId] ?? EMPTY_COACH_POOL;
                const isVictim = teamId === victimTeam;
                const isPickerCol = pickerTeam != null && teamId === pickerTeam;
                const scheme = state.teams[teamId].colorScheme;
                const poolHint = isVictim
                  ? ''
                  : isPickerCol
                    ? ' — сейчас этот игрок убирает'
                    : ' — кандидаты команды';
                return (
                  <div
                    key={teamId}
                    className={`coach-draft-pool-block${isVictim ? ' coach-draft-pool-block--victim' : ' coach-draft-pool-block--eliminate-bystander'}${isPickerCol ? ' coach-draft-pool-block--picker-turn' : ''}`}
                    aria-disabled={!isVictim}
                  >
                    <div className="coach-draft-pool-label">
                      {teamLabel(teamId)}
                      <span className="coach-draft-pool-scheme"> · {schemeLabelRu(scheme)}</span>
                      {poolHint}
                    </div>
                    <div className="coach-draft-grid">
                      {pool.map((c) => {
                        const flag = getCountryFlagUrlRu(c.countryRu);
                        if (isVictim) {
                          const canClick = !isCpuTurn;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              disabled={!canClick}
                              onClick={() => {
                                if (!canClick) return;
                                props.onEliminateCoach(c.id);
                              }}
                              className={cn(
                                'coach-draft-cardbtn',
                                coachCardStarTierClass(c.stars),
                                cpuEliminateHighlightCoachId === c.id && 'coach-draft-cardbtn--cpu-eliminate-highlight',
                              )}
                            >
                              {flag ? (
                                <img src={flag} alt="" className="coach-draft-flag" width={34} height={22} />
                              ) : null}
                              <div className="coach-draft-name">{c.name}</div>
                              <div className="coach-draft-meta">{c.countryRu}</div>
                              <CoachDraftCardProfile coach={c} variant="eliminate" />
                            </button>
                          );
                        }
                        return (
                          <div
                            key={c.id}
                            className={cn('coach-draft-cardbtn coach-draft-cardbtn--readonly', coachCardStarTierClass(c.stars))}
                          >
                            {flag ? (
                              <img src={flag} alt="" className="coach-draft-flag" width={34} height={22} />
                            ) : null}
                            <div className="coach-draft-name">{c.name}</div>
                            <div className="coach-draft-meta">{c.countryRu}</div>
                            <CoachDraftCardProfile coach={c} variant="eliminate" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {cd.step === 'pick' && activeTeam ? (
          <div className="coach-draft-section">
            <div
              className={`coach-draft-pools-row${fourTeamsLayout ? ' coach-draft-pools-row--four' : ''}`}
            >
              {order.map((teamId: TeamId) => {
                const pool = cd.pools[teamId] ?? EMPTY_COACH_POOL;
                const isActivePicker = teamId === activeTeam;
                const scheme = state.teams[teamId].colorScheme;
                const chosen = state.teams[teamId].coach;

                if (pool.length === 0) {
                  const chosenFlag = chosen ? getCountryFlagUrlRu(chosen.countryRu) : null;
                  return (
                    <div
                      key={teamId}
                      className="coach-draft-pool-block coach-draft-pool-block--done"
                    >
                      <div className="coach-draft-pool-label">
                        <span className="coach-draft-pool-name-row">
                          <span>{teamLabel(teamId)}</span>
                          {isCpuControlledTeam(state, teamId) ? (
                            <CpuDifficultyIcon
                              difficulty={state.cpuDifficultyByTeam[teamId]}
                              className="coach-draft-pool-diff"
                            />
                          ) : null}
                        </span>
                        <span className="coach-draft-pool-scheme"> · {schemeLabelRu(scheme)}</span>
                      </div>
                      <div className="coach-draft-pool-done">
                        {chosen ? (
                          <>
                            <div className={cn('coach-draft-pool-done-head', coachDoneHeadTierClass(chosen.stars))}>
                              {chosenFlag ? (
                                <img
                                  src={chosenFlag}
                                  alt=""
                                  className="coach-draft-flag"
                                  width={32}
                                  height={20}
                                />
                              ) : null}
                              <span>
                                Выбран тренер: <strong>{chosen.name}</strong>
                              </span>
                            </div>
                            <CoachDraftCardProfile coach={chosen} variant="pick" />
                          </>
                        ) : (
                          '—'
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={teamId}
                    className={`coach-draft-pool-block${isActivePicker ? ' coach-draft-pool-block--target' : ''}`}
                  >
                    <div className="coach-draft-pool-label">
                      <span className="coach-draft-pool-name-row">
                        <span>{teamLabel(teamId)}</span>
                        {isCpuControlledTeam(state, teamId) ? (
                          <CpuDifficultyIcon
                            difficulty={state.cpuDifficultyByTeam[teamId]}
                            className="coach-draft-pool-diff"
                          />
                        ) : null}
                      </span>
                      <span className="coach-draft-pool-scheme"> · {schemeLabelRu(scheme)}</span>
                      {isActivePicker ? ' — ваш ход' : ' — ожидает соперник'}
                    </div>
                    <div className="coach-draft-grid coach-draft-grid--two">
                      {pool.map((c) => {
                        const flag = getCountryFlagUrlRu(c.countryRu);
                        if (isActivePicker) {
                          const canClick = !isCpuTurn;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              disabled={!canClick}
                              onClick={() => canClick && props.onSelectFinalCoach(c.id)}
                              className={cn('coach-draft-cardbtn coach-draft-cardbtn--pick', coachCardStarTierClass(c.stars))}
                            >
                              {flag ? (
                                <img src={flag} alt="" className="coach-draft-flag" width={38} height={24} />
                              ) : null}
                              <div className="coach-draft-name">{c.name}</div>
                              <div className="coach-draft-meta">{c.countryRu}</div>
                              <CoachDraftCardProfile coach={c} variant="pick" />
                            </button>
                          );
                        }
                        return (
                          <div
                            key={c.id}
                            className={cn(
                              'coach-draft-cardbtn coach-draft-cardbtn--readonly coach-draft-cardbtn--pick',
                              coachCardStarTierClass(c.stars),
                            )}
                          >
                            {flag ? (
                              <img src={flag} alt="" className="coach-draft-flag" width={38} height={24} />
                            ) : null}
                            <div className="coach-draft-name">{c.name}</div>
                            <div className="coach-draft-meta">{c.countryRu}</div>
                            <CoachDraftCardProfile coach={c} variant="pick" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="coach-draft-foot">
          <button type="button" className="coach-draft-ghost" onClick={() => setResetOpen(true)}>
            Новая игра
          </button>
        </div>
      </div>
    </div>
  );
}
