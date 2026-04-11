import { useCallback, useEffect, useMemo, useState } from 'react';

import { useMediaQuery } from '@/shared/lib/useMediaQuery';

import { RulesModal } from '@/shared/ui/rules-modal';

import { FORMATIONS, type FormationId } from '@/entities/game/core/formations';
import type {
  ColorSchemeId,
  GameKind,
  CpuDifficulty,
  CpuDifficultyByTeam,
  GameMode,
  HintsBudget,
  RandomPlayerHintsBudget,
  TeamCount,
  TeamController,
  TeamId,
  TeamState,
} from '@/entities/game/core/types';

import { CpuDifficultyIcon } from '@/shared/ui/cpu-difficulty-icon';
import { FormationPreview } from '@/shared/ui/formation-preview';
import { schemeDotColor } from '@/shared/lib/schemeAccent';

import { APP_VERSION } from '@/shared/config/version';

import {
  DEV_MODE_PASSWORD,
  SETUP_HINT_BUDGETS,
  SETUP_MODE_GROUP_DESCRIPTIONS,
  SETUP_RANDOM_PLAYER_HINT_BUDGETS,
  SETUP_SCHEME_OPTIONS,
  SETUP_TEAM_COUNTS,
  getSetupModeGroupId,
} from './setup-page.constants';
import { formationLabelShort } from './setup-page.utils';

export interface SetupPageProps {
  teamOrder: TeamId[];
  teams: Record<TeamId, TeamState>;
  mode: GameMode;
  gameKind: GameKind;
  cpuDifficultyByTeam: CpuDifficultyByTeam;
  teamControllers: Record<TeamId, TeamController>;
  onSetTeamController: (team: TeamId, controller: TeamController) => void;
  onSetTeamColorScheme: (team: TeamId, scheme: ColorSchemeId) => void;
  onSetTeamCount: (count: TeamCount) => void;
  onSetMode: (mode: GameMode) => void;
  onSetCpuDifficultyForTeam: (team: TeamId, difficulty: CpuDifficulty) => void;
  hintsBudget: HintsBudget;
  onSetHintsBudget: (budget: HintsBudget) => void;
  randomPlayerHintsBudget: RandomPlayerHintsBudget;
  onSetRandomPlayerHintsBudget: (budget: RandomPlayerHintsBudget) => void;
  onApplyDevPreset: () => void;
  onStart: () => void;
}

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

interface CountButtonProps {
  count: TeamCount;
  isActive: boolean;
  onPick: () => void;
  disabled?: boolean;
}

interface HintBudgetButtonProps {
  budget: HintsBudget;
  isActive: boolean;
  onPick: () => void;
}

function HintBudgetButton(props: HintBudgetButtonProps) {
  return (
    <button
      type="button"
      onClick={props.onPick}
      className={cn('setup-seg-btn', props.isActive && 'setup-seg-btn--active')}
      aria-pressed={props.isActive}
    >
      {props.budget}
    </button>
  );
}

interface RandomHintBudgetButtonProps {
  budget: RandomPlayerHintsBudget;
  isActive: boolean;
  onPick: () => void;
}

function RandomHintBudgetButton(props: RandomHintBudgetButtonProps) {
  return (
    <button
      type="button"
      onClick={props.onPick}
      className={cn('setup-seg-btn', props.isActive && 'setup-seg-btn--active')}
      aria-pressed={props.isActive}
    >
      {props.budget}
    </button>
  );
}

function CpuDifficultyButtons(props: {
  value: CpuDifficulty;
  devUnlocked: boolean;
  onPick: (d: CpuDifficulty) => void;
}) {
  return (
    <div className="setup-seg-row">
      <button
        type="button"
        onClick={() => props.onPick('beginner')}
        className={cn('setup-seg-btn', props.value === 'beginner' && 'setup-seg-btn--active')}
        aria-pressed={props.value === 'beginner'}
      >
        Начинающий
      </button>
      <button
        type="button"
        onClick={() => props.onPick('normal')}
        className={cn('setup-seg-btn', props.value === 'normal' && 'setup-seg-btn--active')}
        aria-pressed={props.value === 'normal'}
      >
        Нормальный
      </button>
      <button
        type="button"
        onClick={() => props.onPick('hard')}
        className={cn('setup-seg-btn', props.value === 'hard' && 'setup-seg-btn--active')}
        aria-pressed={props.value === 'hard'}
      >
        Хард
      </button>
      {props.devUnlocked ? (
        <button
          type="button"
          onClick={() => props.onPick('unfair')}
          className={cn('setup-seg-btn', props.value === 'unfair' && 'setup-seg-btn--active')}
          aria-pressed={props.value === 'unfair'}
        >
          Нечестный
        </button>
      ) : null}
    </div>
  );
}

function CountButton(props: CountButtonProps) {
  return (
    <button
      type="button"
      onClick={props.onPick}
      disabled={props.disabled}
      className={cn('setup-seg-btn', props.isActive && 'setup-seg-btn--active')}
      aria-pressed={props.isActive}
    >
      {props.count}
    </button>
  );
}

interface SchemeButtonProps {
  schemeId: ColorSchemeId;
  label: string;
  isActive: boolean;
  onPick: (scheme: ColorSchemeId) => void;
}

function SchemeButton(props: SchemeButtonProps) {
  return (
    <button
      type="button"
      onClick={() => props.onPick(props.schemeId)}
      className={cn('setup-scheme-btn', props.isActive && 'setup-scheme-btn--active')}
      aria-pressed={props.isActive}
    >
      <span
        className="setup-scheme-dot"
        style={{ background: schemeDotColor(props.schemeId) }}
        aria-hidden="true"
      />
      {props.label}
    </button>
  );
}

interface TeamBoxProps {
  teamName: string;
  activeFormation: FormationId;
  colorScheme: ColorSchemeId;
  isFormationDisabled: boolean;
  hideFormationPicker?: boolean;
  formationDeferredNote?: string;
  narrowLayout?: boolean;
  unifyFourPlayers?: boolean;
  /** У команды бота — иконка уровня рядом с названием. */
  cpuDifficulty?: CpuDifficulty | null;
  onPickScheme: (scheme: ColorSchemeId) => void;
  onPickFormation: (formation: FormationId) => void;
}

function TeamBox(props: TeamBoxProps) {
  const inner = props.hideFormationPicker ? (
    <div className="setup-muted">{props.formationDeferredNote ?? 'Схему выберет компьютер при старте игры'}</div>
  ) : (
    <div
      className={cn(
        'setup-formation-grid',
        props.narrowLayout && 'setup-formation-grid--narrow',
      )}
    >
      {(Object.keys(FORMATIONS) as FormationId[]).map((formationId) => (
        <button
          key={formationId}
          type="button"
          onClick={() => props.onPickFormation(formationId)}
          disabled={props.isFormationDisabled}
          className={cn(
            'setup-formation-card',
            props.activeFormation === formationId && 'setup-formation-card--active',
          )}
          title={formationLabelShort(formationId)}
        >
          <div className="setup-formation-name">{formationLabelShort(formationId)}</div>
          <FormationPreview formation={formationId} />
        </button>
      ))}
    </div>
  );

  return (
    <div className={cn('setup-team-box', props.unifyFourPlayers && 'setup-team-box--four-tall')}>
      <div
        className={cn(
          'setup-team-name',
          props.cpuDifficulty != null && 'setup-team-name--with-diff',
        )}
      >
        <span className="setup-team-name-text">{props.teamName}</span>
        {props.cpuDifficulty != null ? (
          <CpuDifficultyIcon difficulty={props.cpuDifficulty} className="setup-team-name-diff" />
        ) : null}
      </div>
      <div className="setup-scheme-row">
        {SETUP_SCHEME_OPTIONS.map((option) => (
          <SchemeButton
            key={option.id}
            schemeId={option.id}
            label={option.label}
            isActive={props.colorScheme === option.id}
            onPick={props.onPickScheme}
          />
        ))}
      </div>
      {props.unifyFourPlayers ? <div className="setup-team-fill-bottom">{inner}</div> : inner}
    </div>
  );
}

export function SetupPage(props: SetupPageProps) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [hintsSettingsOpen, setHintsSettingsOpen] = useState(true);
  const [devUnlocked, setDevUnlocked] = useState(false);
  const [devModalOpen, setDevModalOpen] = useState(false);
  const [devPassword, setDevPassword] = useState('');
  const isNarrow = useMediaQuery('(max-width: 640px)');
  const isFourPlayerMulti = props.gameKind === 'multi' && props.teamOrder.length === 4;

  const randomHintsSupported =
    props.mode === 'nationalTop15' ||
    props.mode === 'nationalTop30' ||
    props.mode === 'rpl' ||
    props.mode === 'clubs' ||
    props.mode === 'chaos';

  const modeGroupId = getSetupModeGroupId(props.mode);

  const hintsEnabled = props.hintsBudget > 0 || props.randomPlayerHintsBudget > 0;

  const isCpuTeam = useCallback(
    (teamId: TeamId): boolean => {
      return props.gameKind === 'vsCpu'
        ? teamId === 'team2'
        : props.teamControllers[teamId] === 'cpu';
    },
    [props.gameKind, props.teamControllers],
  );

  const randomHintBudgetOptions = useMemo((): RandomPlayerHintsBudget[] => {
    const base: RandomPlayerHintsBudget[] = [...SETUP_RANDOM_PLAYER_HINT_BUDGETS];
    if (devUnlocked) base.push(11);
    return base;
  }, [devUnlocked]);

  const bestLineupHintBudgetOptions = useMemo((): HintsBudget[] => {
    const base: HintsBudget[] = [...SETUP_HINT_BUDGETS];
    if (devUnlocked) base.push(11);
    return base;
  }, [devUnlocked]);

  useEffect(() => {
    if (devUnlocked) return;
    if (props.randomPlayerHintsBudget === 11) {
      props.onSetRandomPlayerHintsBudget(3);
    }
  }, [devUnlocked, props.randomPlayerHintsBudget, props.onSetRandomPlayerHintsBudget]);

  useEffect(() => {
    if (devUnlocked) return;
    if (props.hintsBudget === 11) {
      props.onSetHintsBudget(3);
    }
  }, [devUnlocked, props.hintsBudget, props.onSetHintsBudget]);

  useEffect(() => {
    if (devUnlocked) return;
    for (const id of props.teamOrder) {
      if (!isCpuTeam(id)) continue;
      if (props.cpuDifficultyByTeam[id] === 'unfair') {
        props.onSetCpuDifficultyForTeam(id, 'normal');
      }
    }
  }, [devUnlocked, isCpuTeam, props.cpuDifficultyByTeam, props.onSetCpuDifficultyForTeam, props.teamOrder]);

  const handleHintsWith = () => {
    if (!hintsEnabled) {
      props.onSetHintsBudget(1);
      props.onSetRandomPlayerHintsBudget(randomHintsSupported ? 1 : 0);
    }
    setHintsSettingsOpen(true);
  };

  const handleHintsWithout = () => {
    props.onSetHintsBudget(0);
    props.onSetRandomPlayerHintsBudget(0);
    setHintsSettingsOpen(false);
  };

  const handleDevCheckboxChange = useCallback(() => {
    if (!devUnlocked) {
      setDevPassword('');
      setDevModalOpen(true);
      return;
    }
    setDevUnlocked(false);
  }, [devUnlocked]);

  const handleDevModalClose = useCallback(() => {
    setDevModalOpen(false);
    setDevPassword('');
  }, []);

  const handleDevSubmit = useCallback(() => {
    if (devPassword.trim() === DEV_MODE_PASSWORD) {
      props.onApplyDevPreset();
      setDevUnlocked(true);
      setDevModalOpen(false);
      setDevPassword('');
      setHintsSettingsOpen(true);
      return;
    }
    setDevPassword('');
  }, [devPassword, props]);

  useEffect(() => {
    if (!devModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleDevModalClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [devModalOpen, handleDevModalClose]);

  useEffect(() => {
    if (!devModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [devModalOpen]);

  return (
    <>
      <div className="fc-page">
        <div className="setup-card">
          <header className="setup-hero">
            <div>
              <div className="setup-kicker">
                <span className="setup-kicker-icon" aria-hidden="true">
                  ⚽
                </span>
                Настройка партии
              </div>
              <h1 className="setup-title fc-heading">Футбольный драфт</h1>
              <p className="setup-sub">
                Выберите режим драфта и сколько людей играет (1 — против компьютера), затем настройте команды и
                начните игру.
              </p>
            </div>
            <div className="setup-header-actions">
              <label className="setup-dev-checkbox">
                <input type="checkbox" checked={devUnlocked} onChange={handleDevCheckboxChange} />
                Режим разработки
              </label>
              <button type="button" onClick={() => setRulesOpen(true)} className="setup-rules-btn">
                Правила
              </button>
            </div>
          </header>

          <section className="setup-section" aria-labelledby="setup-mode-heading">
            <div className="setup-label-row">
              <h2 id="setup-mode-heading" className="setup-label">
                Режим игры
              </h2>
            </div>
            <div className="setup-seg-row">
              <button
                type="button"
                onClick={() => props.onSetMode('nationalTop15')}
                className={cn('setup-seg-btn', modeGroupId === 'nations' && 'setup-seg-btn--active')}
                aria-pressed={modeGroupId === 'nations'}
              >
                Сборные
              </button>
              <button
                type="button"
                onClick={() => props.onSetMode('clubs')}
                className={cn('setup-seg-btn', modeGroupId === 'clubs' && 'setup-seg-btn--active')}
                aria-pressed={modeGroupId === 'clubs'}
              >
                Клубы
              </button>
              <button
                type="button"
                onClick={() => props.onSetMode('chaos')}
                className={cn('setup-seg-btn', modeGroupId === 'chaos' && 'setup-seg-btn--active')}
                aria-pressed={modeGroupId === 'chaos'}
              >
                Хаос
              </button>
            </div>

            {modeGroupId === 'nations' ? (
              <div className="setup-nested">
                <div className="setup-label-row">
                  <span className="setup-label-muted">Сборные</span>
                </div>
                <div className="setup-seg-row">
                  <button
                    type="button"
                    onClick={() => props.onSetMode('nationalTop15')}
                    className={cn('setup-seg-btn', props.mode === 'nationalTop15' && 'setup-seg-btn--active')}
                    aria-pressed={props.mode === 'nationalTop15'}
                  >
                    ТОП-15
                  </button>
                  <button
                    type="button"
                    onClick={() => props.onSetMode('nationalTop30')}
                    className={cn('setup-seg-btn', props.mode === 'nationalTop30' && 'setup-seg-btn--active')}
                    aria-pressed={props.mode === 'nationalTop30'}
                  >
                    ТОП-30
                  </button>
                </div>
              </div>
            ) : null}

            {modeGroupId === 'clubs' ? (
              <div className="setup-nested">
                <div className="setup-label-row">
                  <span className="setup-label-muted">Клубы</span>
                </div>
                <div className="setup-seg-row">
                  <button
                    type="button"
                    onClick={() => props.onSetMode('clubs')}
                    className={cn('setup-seg-btn', props.mode === 'clubs' && 'setup-seg-btn--active')}
                    aria-pressed={props.mode === 'clubs'}
                  >
                    Европейские
                  </button>
                  <button
                    type="button"
                    onClick={() => props.onSetMode('rpl')}
                    className={cn('setup-seg-btn', props.mode === 'rpl' && 'setup-seg-btn--active')}
                    aria-pressed={props.mode === 'rpl'}
                  >
                    РПЛ
                  </button>
                </div>
              </div>
            ) : null}

            <p className="setup-callout">{SETUP_MODE_GROUP_DESCRIPTIONS[modeGroupId]}</p>
          </section>

          <section className="setup-section" aria-labelledby="setup-players-heading">
            <div className="setup-label-row">
              <h2 id="setup-players-heading" className="setup-label">
                Количество игроков
              </h2>
              <span className="setup-muted">
                1 — один человек против компьютера (две команды); 2–4 — только люди или смесь с компьютером
              </span>
            </div>
            <div className="setup-seg-row">
              {SETUP_TEAM_COUNTS.map((count) => {
                const activeCount = props.gameKind === 'vsCpu' ? 1 : props.teamOrder.length;
                return (
                  <CountButton
                    key={count}
                    count={count}
                    isActive={activeCount === count}
                    onPick={() => props.onSetTeamCount(count)}
                  />
                );
              })}
            </div>
          </section>

          {props.gameKind === 'vsCpu' ? (
            <section className="setup-section" aria-labelledby="setup-cpu-diff-heading">
              <div className="setup-label-row">
                <h2 id="setup-cpu-diff-heading" className="setup-label">
                  Сложность компьютера
                </h2>
                <span className="setup-muted">
                  Влияет на выбор игроков и тренеров по уровню (★).
                  {devUnlocked
                    ? ' «Нечестный»: компьютер набирает из общего сильного пула, не из страны или клуба раунда.'
                    : null}
                </span>
              </div>
              <CpuDifficultyButtons
                value={props.cpuDifficultyByTeam.team2}
                devUnlocked={devUnlocked}
                onPick={(d) => props.onSetCpuDifficultyForTeam('team2', d)}
              />
            </section>
          ) : null}

          {props.gameKind === 'multi' ? (
            <section className="setup-section" aria-labelledby="setup-who-heading">
              <div className="setup-label-row">
                <h2 id="setup-who-heading" className="setup-label">
                  Кто играет
                </h2>
                <span className="setup-muted">Можно смешивать людей и компьютеры (2–4 команды)</span>
              </div>
              <div
                className={cn(
                  'setup-team-grid',
                  isFourPlayerMulti && 'setup-team-grid--four',
                )}
              >
                {props.teamOrder.map((teamId, index) => {
                  const controller = props.teamControllers[teamId] ?? 'human';
                  const cpuDisabled = teamId === 'team1';
                  const whoMeta = (
                    <>
                      {controller === 'cpu' ? (
                        <>
                          <div className="setup-muted">Схему выберет компьютер при старте игры</div>
                          <div>
                            <div className="setup-label-muted">Сложность компьютера</div>
                            <CpuDifficultyButtons
                              value={props.cpuDifficultyByTeam[teamId]}
                              devUnlocked={devUnlocked}
                              onPick={(d) => props.onSetCpuDifficultyForTeam(teamId, d)}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="setup-muted">Ходы этой команды делаете вы</div>
                      )}
                    </>
                  );

                  return (
                    <div
                      key={teamId}
                      className={cn('setup-team-box', isFourPlayerMulti && 'setup-team-box--who-four')}
                    >
                      <div className="setup-team-name">Команда {index + 1}</div>
                      <div className="setup-seg-row">
                        <button
                          type="button"
                          onClick={() => props.onSetTeamController(teamId, 'human')}
                          className={cn('setup-seg-btn', controller === 'human' && 'setup-seg-btn--active')}
                          aria-pressed={controller === 'human'}
                        >
                          Игрок
                        </button>
                        <button
                          type="button"
                          onClick={() => props.onSetTeamController(teamId, 'cpu')}
                          disabled={cpuDisabled}
                          className={cn('setup-seg-btn', controller === 'cpu' && 'setup-seg-btn--active')}
                          aria-pressed={controller === 'cpu'}
                          title={
                            cpuDisabled ? 'Команда 1 всегда игрок' : 'Компьютер будет ходить автоматически'
                          }
                        >
                          Компьютер
                        </button>
                      </div>
                      {isFourPlayerMulti ? (
                        <div className="setup-who-plays-meta">{whoMeta}</div>
                      ) : controller === 'cpu' ? (
                        <>
                          <div className="setup-muted">Схему выберет компьютер при старте игры</div>
                          <div className="setup-nested">
                            <div className="setup-label-muted">Сложность компьютера</div>
                            <CpuDifficultyButtons
                              value={props.cpuDifficultyByTeam[teamId]}
                              devUnlocked={devUnlocked}
                              onPick={(d) => props.onSetCpuDifficultyForTeam(teamId, d)}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="setup-muted">Ходы этой команды делаете вы</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="setup-section" aria-labelledby="setup-hints-heading">
            <div className="setup-label-row">
              <h2 id="setup-hints-heading" className="setup-label">
                Подсказки
              </h2>
              <span className="setup-muted">Можно играть без подсказок или настроить их отдельно</span>
            </div>
            <div className="setup-seg-row">
              <button
                type="button"
                onClick={handleHintsWith}
                className={cn('setup-seg-btn', hintsEnabled && 'setup-seg-btn--active')}
                aria-pressed={hintsEnabled}
              >
                С подсказками
              </button>
              <button
                type="button"
                onClick={handleHintsWithout}
                className={cn('setup-seg-btn', !hintsEnabled && 'setup-seg-btn--active')}
                aria-pressed={!hintsEnabled}
              >
                Без подсказок
              </button>
            </div>

            {hintsEnabled ? (
              <div className="setup-hints-panel">
                <button
                  type="button"
                  onClick={() => setHintsSettingsOpen((v) => !v)}
                  className="setup-hints-toggle"
                  aria-expanded={hintsSettingsOpen}
                >
                  <span className="setup-hints-chevron" aria-hidden="true">
                    {hintsSettingsOpen ? '▼' : '▶'}
                  </span>
                  Какие подсказки
                </button>
                {hintsSettingsOpen ? (
                  <div className="setup-hints-body">
                    <div className="setup-hints-cols">
                      <div className="setup-hints-col">
                        <div className="setup-label-row">
                          <span className="setup-label">«Лучший состав» на команду за игру</span>
                        </div>
                        <div className="setup-seg-row">
                          {bestLineupHintBudgetOptions.map((budget) => (
                            <HintBudgetButton
                              key={budget}
                              budget={budget}
                              isActive={props.hintsBudget === budget}
                              onPick={() => props.onSetHintsBudget(budget)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {randomHintsSupported ? (
                      <div className="setup-nested">
                        <div className="setup-label-row">
                          <span className="setup-label">«Случайный игрок» на команду за игру</span>
                        </div>
                        <div className="setup-seg-row">
                          {randomHintBudgetOptions.map((budget) => (
                            <RandomHintBudgetButton
                              key={budget}
                              budget={budget}
                              isActive={props.randomPlayerHintsBudget === budget}
                              onPick={() => props.onSetRandomPlayerHintsBudget(budget)}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="setup-section" aria-labelledby="setup-colors-heading">
            <div className="setup-label-row">
              <h2 id="setup-colors-heading" className="setup-label">
                Цвет команд
              </h2>
              <span className="setup-muted">
                Схему поля выберете после драфта тренера — с подсказкой по приоритету тренера.
              </span>
            </div>
            <div
              className={cn(
                'setup-team-grid',
                isFourPlayerMulti && 'setup-team-grid--four',
              )}
            >
              {props.teamOrder.map((teamId) => {
                const team = props.teams[teamId];
                const cpu = isCpuTeam(teamId);
                const displayTeamName = cpu ? `Нейро ${team.name}` : team.name;

                return (
                  <TeamBox
                    key={teamId}
                    teamName={displayTeamName}
                    activeFormation={team.formation}
                    colorScheme={team.colorScheme}
                    isFormationDisabled
                    hideFormationPicker
                    formationDeferredNote="Схему поля выберете на следующем шаге (после тренера)."
                    narrowLayout={isNarrow}
                    unifyFourPlayers={isFourPlayerMulti}
                    cpuDifficulty={cpu ? props.cpuDifficultyByTeam[teamId] : null}
                    onPickScheme={(scheme) => props.onSetTeamColorScheme(teamId, scheme)}
                    onPickFormation={() => {}}
                  />
                );
              })}
            </div>
          </section>

          <section className="setup-section">
            <div className="setup-actions">
              <button type="button" onClick={props.onStart} className="setup-primary-btn">
                Начать игру
              </button>
            </div>
          </section>

          <p className="setup-version">Версия {APP_VERSION}</p>
        </div>
      </div>
      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
      {devModalOpen ? (
        <div
          className="setup-dev-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dev-modal-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleDevModalClose();
          }}
        >
          <div className="setup-dev-card" onMouseDown={(e) => e.stopPropagation()}>
            <h2 id="dev-modal-title" className="setup-dev-title">
              Режим разработки
            </h2>
            <p className="setup-dev-sub">Введите пароль</p>
            <input
              type="password"
              value={devPassword}
              onChange={(e) => setDevPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleDevSubmit();
              }}
              className="setup-dev-input"
              autoFocus
              autoComplete="off"
            />
            <div className="setup-dev-actions">
              <button type="button" onClick={handleDevModalClose} className="setup-dev-btn-ghost">
                Отмена
              </button>
              <button type="button" onClick={handleDevSubmit} className="setup-dev-btn-primary">
                Войти
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
