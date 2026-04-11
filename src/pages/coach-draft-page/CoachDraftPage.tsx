import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  coachDraftEliminationTotalSteps,
  coachDraftPickerAtStep,
  coachDraftVictimAtStep,
} from '@/entities/game/core/coachDraftPhase';
import type { CoachAssignment, ColorSchemeId, GameState, TeamId } from '@/entities/game/core/types';
import { pickCpuEliminateOneCoachId, pickCpuFinalCoachId } from '@/entities/game/data/coaches';
import { isCpuControlledTeam } from '@/entities/game/modes/gameMode';
import { getCountryFlagUrlRu } from '@/entities/game/data/topCountries';
import {
  schemeAccent,
  schemeLabelRu,
  schemePanelBackground,
  schemePanelTextColor,
  schemeShortRu,
} from '@/shared/lib/schemeAccent';

import { APP_VERSION } from '@/shared/config/version';
import { ConfirmNewGameModal } from '@/shared/ui/confirm-new-game-modal';
import { CpuDifficultyIcon } from '@/shared/ui/cpu-difficulty-icon';

const CPU_COACH_THINK_MS = 3000;

/** Стабильная ссылка: иначе `useCallback(handleCpu)` меняется каждый рендер и сбрасывает таймер CPU. */
const EMPTY_COACH_POOL: readonly CoachAssignment[] = [];

function coachDraftPoolBlockStyle(colorScheme: ColorSchemeId): CSSProperties {
  return {
    borderColor: schemeAccent(colorScheme),
    background: schemePanelBackground(colorScheme),
    color: schemePanelTextColor(colorScheme),
  };
}

function coachFlowPillStyle(colorScheme: ColorSchemeId): CSSProperties {
  return {
    border: `1px solid ${schemeAccent(colorScheme)}`,
    background: schemePanelBackground(colorScheme),
    color: schemePanelTextColor(colorScheme),
  };
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
  const cpuLockRef = useRef<string | null>(null);
  const thinkTimerRef = useRef<number | null>(null);

  const order = state.teamOrder;
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
      const vName = state.teams[victimTeam].name;
      const pName = state.teams[pickerTeam].name;
      return `${pName} убирает одного тренера из списка «${vName}» (шаг ${cd.eliminationStepIndex + 1} из ${coachDraftEliminationTotalSteps(order.length)}). Останется двое.`;
    }
    if (cd.step === 'pick' && activeTeam) {
      return `${state.teams[activeTeam].name}: выберите одного тренера из двух — он появится на схеме команды.`;
    }
    return '';
  }, [cd, activeTeam, victimTeam, pickerTeam, state.teams, order.length]);

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
      setCpuThinking(true);
      thinkTimerRef.current = window.setTimeout(() => {
        thinkTimerRef.current = null;
        const id = pickCpuEliminateOneCoachId(
          victimPool,
          pickerTeam ? state.cpuDifficultyByTeam[pickerTeam] : 'normal',
        );
        props.onEliminateCoach(id);
        setCpuThinking(false);
      }, CPU_COACH_THINK_MS);
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
                <strong className="coach-draft-current-pair-picker">{state.teams[pickerTeam].name}</strong>
                <span className="coach-draft-current-pair-mid"> убирает у </span>
                <strong className="coach-draft-current-pair-victim">{state.teams[victimTeam].name}</strong>
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
                        title={`Шаг ${sIdx + 1}: ${pTeam.name} → ${vTeam.name}`}
                      >
                        <span className="coach-draft-flow-step-idx">{sIdx + 1}</span>
                        <div className="coach-draft-flow-cell">
                          <span className="coach-draft-flow-pill" style={coachFlowPillStyle(pTeam.colorScheme)}>
                            {schemeShortRu(pTeam.colorScheme)}
                          </span>
                          <span className="coach-draft-flow-mid" aria-hidden="true">
                            →
                          </span>
                          <span
                            className="coach-draft-flow-pill coach-draft-flow-pill--victim"
                            style={coachFlowPillStyle(vTeam.colorScheme)}
                          >
                            {schemeShortRu(vTeam.colorScheme)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <div className="coach-draft-hint">
              Нажмите на карточку тренера в колонке «у этой команды убирают», чтобы снять его с драфта. Очередь
              соперников меняется по кругу (сначала у соседа в списке, затем у следующего и т.д.), чтобы снимали у
              разных команд. У всех команд разные тренеры в пулах; сильные и слабые стороны — только на финале.
            </div>
            <div
              className={`coach-draft-pools-row${fourTeamsLayout ? ' coach-draft-pools-row--four' : ''}`}
            >
              {order.map((teamId: TeamId) => {
                const pool = cd.pools[teamId] ?? EMPTY_COACH_POOL;
                const isVictim = teamId === victimTeam;
                const isPickerCol = pickerTeam != null && teamId === pickerTeam;
                const scheme = state.teams[teamId].colorScheme;
                const accent = schemeAccent(scheme);
                const poolHint = isVictim
                  ? ' — у этой команды убирают тренера'
                  : isPickerCol
                    ? ' — сейчас этот игрок убирает'
                    : ' — кандидаты команды';
                return (
                  <div
                    key={teamId}
                    className={`coach-draft-pool-block${isVictim ? ' coach-draft-pool-block--victim' : ' coach-draft-pool-block--eliminate-bystander'}${isPickerCol ? ' coach-draft-pool-block--picker-turn' : ''}`}
                    style={coachDraftPoolBlockStyle(scheme)}
                    aria-disabled={!isVictim}
                  >
                    <div className="coach-draft-pool-label">
                      {state.teams[teamId].name}
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
                              className="coach-draft-cardbtn"
                              style={{ ['--coach-accent' as string]: accent }}
                            >
                              {flag ? (
                                <img src={flag} alt="" className="coach-draft-flag" width={34} height={22} />
                              ) : null}
                              <div className="coach-draft-name">{c.name}</div>
                              <div className="coach-draft-meta">
                                {c.countryRu} · {c.stars}★
                              </div>
                              <CoachDraftCardProfile coach={c} variant="eliminate" />
                            </button>
                          );
                        }
                        return (
                          <div
                            key={c.id}
                            className="coach-draft-cardbtn coach-draft-cardbtn--readonly"
                            style={{ ['--coach-accent' as string]: accent }}
                          >
                            {flag ? (
                              <img src={flag} alt="" className="coach-draft-flag" width={34} height={22} />
                            ) : null}
                            <div className="coach-draft-name">{c.name}</div>
                            <div className="coach-draft-meta">
                              {c.countryRu} · {c.stars}★
                            </div>
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
                const accent = schemeAccent(scheme);
                const chosen = state.teams[teamId].coach;

                if (pool.length === 0) {
                  const chosenFlag = chosen ? getCountryFlagUrlRu(chosen.countryRu) : null;
                  return (
                    <div
                      key={teamId}
                      className="coach-draft-pool-block coach-draft-pool-block--done"
                      style={coachDraftPoolBlockStyle(scheme)}
                    >
                      <div className="coach-draft-pool-label">
                        <span className="coach-draft-pool-name-row">
                          <span>{state.teams[teamId].name}</span>
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
                            <div className="coach-draft-pool-done-head">
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
                                Выбран тренер: <strong>{chosen.name}</strong> ({chosen.stars}★)
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
                    style={coachDraftPoolBlockStyle(scheme)}
                  >
                    <div className="coach-draft-pool-label">
                      <span className="coach-draft-pool-name-row">
                        <span>{state.teams[teamId].name}</span>
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
                              className="coach-draft-cardbtn coach-draft-cardbtn--pick"
                              style={{ ['--coach-accent' as string]: accent }}
                            >
                              {flag ? (
                                <img src={flag} alt="" className="coach-draft-flag" width={38} height={24} />
                              ) : null}
                              <div className="coach-draft-name">{c.name}</div>
                              <div className="coach-draft-meta">
                                {c.countryRu} · {c.stars}★
                              </div>
                              <CoachDraftCardProfile coach={c} variant="pick" />
                            </button>
                          );
                        }
                        return (
                          <div
                            key={c.id}
                            className="coach-draft-cardbtn coach-draft-cardbtn--readonly coach-draft-cardbtn--pick"
                            style={{ ['--coach-accent' as string]: accent }}
                          >
                            {flag ? (
                              <img src={flag} alt="" className="coach-draft-flag" width={38} height={24} />
                            ) : null}
                            <div className="coach-draft-name">{c.name}</div>
                            <div className="coach-draft-meta">
                              {c.countryRu} · {c.stars}★
                            </div>
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
