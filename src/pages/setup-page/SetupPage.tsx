import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from 'react';

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
      style={{ ...baseStyles.countBtn, ...(props.isActive ? baseStyles.countBtnActive : null) }}
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
      style={{ ...baseStyles.countBtn, ...(props.isActive ? baseStyles.countBtnActive : null) }}
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
  const rowStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 };
  return (
    <div style={rowStyle}>
      <button
        type="button"
        onClick={() => props.onPick('beginner')}
        style={{
          ...baseStyles.modeBtn,
          ...(props.value === 'beginner' ? baseStyles.modeBtnActive : null),
        }}
        aria-pressed={props.value === 'beginner'}
      >
        Начинающий
      </button>
      <button
        type="button"
        onClick={() => props.onPick('normal')}
        style={{
          ...baseStyles.modeBtn,
          ...(props.value === 'normal' ? baseStyles.modeBtnActive : null),
        }}
        aria-pressed={props.value === 'normal'}
      >
        Нормальный
      </button>
      <button
        type="button"
        onClick={() => props.onPick('hard')}
        style={{
          ...baseStyles.modeBtn,
          ...(props.value === 'hard' ? baseStyles.modeBtnActive : null),
        }}
        aria-pressed={props.value === 'hard'}
      >
        Хард
      </button>
      {props.devUnlocked ? (
        <button
          type="button"
          onClick={() => props.onPick('unfair')}
          style={{
            ...baseStyles.modeBtn,
            ...(props.value === 'unfair' ? baseStyles.modeBtnActive : null),
          }}
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
      style={{ ...baseStyles.countBtn, ...(props.isActive ? baseStyles.countBtnActive : null) }}
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
      style={{ ...baseStyles.schemeBtn, ...(props.isActive ? baseStyles.schemeBtnActive : null) }}
      aria-pressed={props.isActive}
    >
      <span style={{ ...baseStyles.schemeDot, background: schemeDotColor(props.schemeId) }} aria-hidden="true" />
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
  /** Текст под цветами, если сетку выбирают позже */
  formationDeferredNote?: string;
  /** Узкая вёрстка: одна колонка сетки схем */
  narrowLayout?: boolean;
  /** Ровная высота карточек в сетке 2×2 (четыре команды). */
  unifyFourPlayers?: boolean;
  onPickScheme: (scheme: ColorSchemeId) => void;
  onPickFormation: (formation: FormationId) => void;
}

function TeamBox(props: TeamBoxProps) {
  const cardShell: CSSProperties = {
    ...baseStyles.teamBox,
    ...(props.unifyFourPlayers
      ? {
          display: 'flex',
          flexDirection: 'column',
          minHeight: 320,
          height: '100%',
          boxSizing: 'border-box',
        }
      : null),
  };

  const bottomGrow: CSSProperties = {
    flex: '1 1 auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    marginTop: 10,
    minHeight: 0,
  };

  const inner =
    props.hideFormationPicker ? (
      <div style={baseStyles.muted}>
        {props.formationDeferredNote ?? 'Схему выберет компьютер при старте игры'}
      </div>
    ) : (
      <div
        style={{
          ...baseStyles.formationGrid,
          gridTemplateColumns: props.narrowLayout ? '1fr' : 'repeat(2, minmax(0, 1fr))',
        }}
      >
        {(Object.keys(FORMATIONS) as FormationId[]).map((formationId) => (
          <button
            key={formationId}
            type="button"
            onClick={() => props.onPickFormation(formationId)}
            disabled={props.isFormationDisabled}
            style={{
              ...baseStyles.formationCard,
              ...(props.activeFormation === formationId ? baseStyles.formationCardActive : null),
              ...(props.isFormationDisabled ? baseStyles.formationCardDisabled : null),
            }}
            title={formationLabelShort(formationId)}
          >
            <div style={baseStyles.formationCardTop}>
              <div style={baseStyles.formationName}>{formationLabelShort(formationId)}</div>
            </div>
            <FormationPreview formation={formationId} />
          </button>
        ))}
      </div>
    );

  return (
    <div style={cardShell}>
      <div style={baseStyles.teamNameDisplay}>{props.teamName}</div>
      <div style={baseStyles.schemeRowWithGap}>
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
      {props.unifyFourPlayers ? <div style={bottomGrow}>{inner}</div> : inner}
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

  const styles = useMemo((): typeof baseStyles => {
    return {
      ...baseStyles,
      page: {
        ...baseStyles.page,
        padding: isNarrow
          ? 'max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left))'
          : 24,
      },
      card: {
        ...baseStyles.card,
        padding: isNarrow ? 14 : 20,
      },
      headerRow: {
        ...baseStyles.headerRow,
        flexDirection: isNarrow ? 'column' : 'row',
        alignItems: isNarrow ? 'stretch' : 'flex-start',
        gap: isNarrow ? 12 : 16,
      },
      h1: { ...baseStyles.h1, fontSize: isNarrow ? 24 : 28 },
      teamFormations: {
        ...baseStyles.teamFormations,
        gridTemplateColumns: isNarrow ? '1fr' : 'repeat(2, minmax(0, 1fr))',
        ...(isFourPlayerMulti ? { gap: 14, alignItems: 'stretch' } : {}),
      },
      teamWhoPlaysBox: {
        ...baseStyles.teamBox,
        ...(isFourPlayerMulti
          ? {
              display: 'flex',
              flexDirection: 'column',
              minHeight: 284,
              height: '100%',
              boxSizing: 'border-box',
            }
          : {}),
      },
      teamWhoPlaysMeta: isFourPlayerMulti
        ? {
            marginTop: 10,
            flex: '1 1 auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            gap: 8,
            minHeight: 132,
          }
        : { marginTop: 0 },
    };
  }, [isNarrow, isFourPlayerMulti]);

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

  /** «11» доступно только в режиме разработки; обычным игрокам — только 1–3. */
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
    // Чекбокс контролируемый (checked={devUnlocked}), поэтому полагаемся на текущее состояние,
    // а не на event.target.checked (оно может быть неконсистентно при мгновенном откате UI).
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
      <div style={styles.page}>
        <div style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <div style={styles.h1}>Футбольный драфт</div>
            <div style={styles.sub}>
              Выберите режим драфта и сколько людей играет (1 — против компьютера), затем настройте команды и начните игру.
            </div>
          </div>
          <div style={styles.headerActions}>
            <label style={styles.devCheckboxLabel}>
              <input
                type="checkbox"
                checked={devUnlocked}
                onChange={handleDevCheckboxChange}
                style={styles.devCheckbox}
              />
              Режим разработки
            </label>
            <button type="button" onClick={() => setRulesOpen(true)} style={styles.rulesBtn}>
              Правила
            </button>
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.labelRow}>
            <div style={styles.label}>Режим игры</div>
          </div>
          <div style={styles.modeRow}>
            <button
              type="button"
              onClick={() => props.onSetMode('nationalTop15')}
              style={{
                ...styles.modeBtn,
                ...(modeGroupId === 'nations' ? styles.modeBtnActive : null),
              }}
              aria-pressed={modeGroupId === 'nations'}
            >
              Сборные
            </button>
            <button
              type="button"
              onClick={() => props.onSetMode('clubs')}
              style={{
                ...styles.modeBtn,
                ...(modeGroupId === 'clubs' ? styles.modeBtnActive : null),
              }}
              aria-pressed={modeGroupId === 'clubs'}
            >
              Клубы
            </button>
            <button
              type="button"
              onClick={() => props.onSetMode('chaos')}
              style={{
                ...styles.modeBtn,
                ...(modeGroupId === 'chaos' ? styles.modeBtnActive : null),
              }}
              aria-pressed={modeGroupId === 'chaos'}
            >
              Хаос
            </button>
          </div>

          {modeGroupId === 'nations' ? (
            <div style={{ marginTop: 12 }}>
              <div style={styles.labelRow}>
                <div style={styles.labelMuted}>Сборные</div>
              </div>
              <div style={styles.modeRow}>
                <button
                  type="button"
                  onClick={() => props.onSetMode('nationalTop15')}
                  style={{
                    ...styles.modeBtn,
                    ...(props.mode === 'nationalTop15' ? styles.modeBtnActive : null),
                  }}
                  aria-pressed={props.mode === 'nationalTop15'}
                >
                  ТОП-15
                </button>
                <button
                  type="button"
                  onClick={() => props.onSetMode('nationalTop30')}
                  style={{
                    ...styles.modeBtn,
                    ...(props.mode === 'nationalTop30' ? styles.modeBtnActive : null),
                  }}
                  aria-pressed={props.mode === 'nationalTop30'}
                >
                  ТОП-30
                </button>
              </div>
            </div>
          ) : null}

          {modeGroupId === 'clubs' ? (
            <div style={{ marginTop: 12 }}>
              <div style={styles.labelRow}>
                <div style={styles.labelMuted}>Клубы</div>
              </div>
              <div style={styles.modeRow}>
                <button
                  type="button"
                  onClick={() => props.onSetMode('clubs')}
                  style={{
                    ...styles.modeBtn,
                    ...(props.mode === 'clubs' ? styles.modeBtnActive : null),
                  }}
                  aria-pressed={props.mode === 'clubs'}
                >
                  Европейские
                </button>
                <button
                  type="button"
                  onClick={() => props.onSetMode('rpl')}
                  style={{
                    ...styles.modeBtn,
                    ...(props.mode === 'rpl' ? styles.modeBtnActive : null),
                  }}
                  aria-pressed={props.mode === 'rpl'}
                >
                  РПЛ
                </button>
              </div>
            </div>
          ) : null}

          <div style={styles.modeHelpBox}>{SETUP_MODE_GROUP_DESCRIPTIONS[modeGroupId]}</div>
        </div>

        <div style={styles.section}>
          <div style={styles.labelRow}>
            <div style={styles.label}>Количество игроков</div>
            <div style={styles.muted}>1 — один человек против компьютера (две команды); 2–4 — только люди или смесь с компьютером</div>
          </div>
          <div style={styles.teamCountRow}>
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
        </div>

        {props.gameKind === 'vsCpu' ? (
          <div style={styles.section}>
            <div style={styles.labelRow}>
              <div style={styles.label}>Сложность компьютера</div>
              <div style={styles.muted}>
                Влияет на выбор игроков и тренеров по уровню (★).
                {devUnlocked
                  ? ' «Нечестный»: компьютер набирает из общего сильного пула, не из страны или клуба раунда.'
                  : null}
              </div>
            </div>
            <CpuDifficultyButtons
              value={props.cpuDifficultyByTeam.team2}
              devUnlocked={devUnlocked}
              onPick={(d) => props.onSetCpuDifficultyForTeam('team2', d)}
            />
          </div>
        ) : null}

        {props.gameKind === 'multi' ? (
          <div style={styles.section}>
            <div style={styles.labelRow}>
              <div style={styles.label}>Кто играет</div>
              <div style={styles.muted}>Можно смешивать людей и компьютеры (2–4 команды)</div>
            </div>
            <div style={styles.teamFormations}>
              {props.teamOrder.map((teamId, index) => {
                const controller = props.teamControllers[teamId] ?? 'human';
                const cpuDisabled = teamId === 'team1';
                const whoMeta = (
                  <>
                    {controller === 'cpu' ? (
                      <>
                        <div style={styles.muted}>Схему выберет компьютер при старте игры</div>
                        <div>
                          <div style={styles.labelMuted}>Сложность компьютера</div>
                          <CpuDifficultyButtons
                            value={props.cpuDifficultyByTeam[teamId]}
                            devUnlocked={devUnlocked}
                            onPick={(d) => props.onSetCpuDifficultyForTeam(teamId, d)}
                          />
                        </div>
                      </>
                    ) : (
                      <div style={styles.muted}>Ходы этой команды делаете вы</div>
                    )}
                  </>
                );

                return (
                  <div key={teamId} style={isFourPlayerMulti ? styles.teamWhoPlaysBox : styles.teamBox}>
                    <div style={styles.teamNameDisplay}>Команда {index + 1}</div>
                    <div style={styles.modeRow}>
                      <button
                        type="button"
                        onClick={() => props.onSetTeamController(teamId, 'human')}
                        style={{
                          ...styles.modeBtn,
                          ...(controller === 'human' ? styles.modeBtnActive : null),
                        }}
                        aria-pressed={controller === 'human'}
                      >
                        Игрок
                      </button>
                      <button
                        type="button"
                        onClick={() => props.onSetTeamController(teamId, 'cpu')}
                        disabled={cpuDisabled}
                        style={{
                          ...styles.modeBtn,
                          ...(controller === 'cpu' ? styles.modeBtnActive : null),
                          ...(cpuDisabled ? { opacity: 0.55, cursor: 'not-allowed' } : null),
                        }}
                        aria-pressed={controller === 'cpu'}
                        title={cpuDisabled ? 'Команда 1 всегда игрок' : 'Компьютер будет ходить автоматически'}
                      >
                        Компьютер
                      </button>
                    </div>
                    {isFourPlayerMulti ? (
                      <div style={styles.teamWhoPlaysMeta}>{whoMeta}</div>
                    ) : controller === 'cpu' ? (
                      <>
                        <div style={styles.muted}>Схему выберет компьютер при старте игры</div>
                        <div style={{ marginTop: 10 }}>
                          <div style={styles.labelMuted}>Сложность компьютера</div>
                          <CpuDifficultyButtons
                            value={props.cpuDifficultyByTeam[teamId]}
                            devUnlocked={devUnlocked}
                            onPick={(d) => props.onSetCpuDifficultyForTeam(teamId, d)}
                          />
                        </div>
                      </>
                    ) : (
                      <div style={styles.muted}>Ходы этой команды делаете вы</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div style={styles.section}>
          <div style={styles.labelRow}>
            <div style={styles.label}>Подсказки</div>
            <div style={styles.muted}>Можно играть без подсказок или настроить их отдельно</div>
          </div>
          <div style={styles.modeRow}>
            <button
              type="button"
              onClick={handleHintsWith}
              style={{
                ...styles.modeBtn,
                ...(hintsEnabled ? styles.modeBtnActive : null),
              }}
              aria-pressed={hintsEnabled}
            >
              С подсказками
            </button>
            <button
              type="button"
              onClick={handleHintsWithout}
              style={{
                ...styles.modeBtn,
                ...(!hintsEnabled ? styles.modeBtnActive : null),
              }}
              aria-pressed={!hintsEnabled}
            >
              Без подсказок
            </button>
          </div>

          {hintsEnabled ? (
            <div style={styles.hintsPanel}>
              <button
                type="button"
                onClick={() => setHintsSettingsOpen((v) => !v)}
                style={styles.hintsPanelToggle}
                aria-expanded={hintsSettingsOpen}
              >
                <span style={styles.hintsPanelChevron} aria-hidden="true">
                  {hintsSettingsOpen ? '▼' : '▶'}
                </span>
                Какие подсказки
              </button>
              {hintsSettingsOpen ? (
                <div style={styles.hintsPanelBody}>
                  <div style={styles.hintsFormatRow}>
                    <div style={styles.hintsFormatCol}>
                      <div style={styles.labelRow}>
                        <div style={styles.label}>«Лучший состав» на команду за игру</div>
                      </div>
                      <div style={styles.teamCountRow}>
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
                    <div style={{ marginTop: 16 }}>
                      <div style={styles.labelRow}>
                        <div style={styles.label}>«Случайный игрок» на команду за игру</div>
                      </div>
                      <div style={styles.teamCountRow}>
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
        </div>

        <div style={styles.section}>
          <div style={styles.labelRow}>
            <div style={styles.label}>Цвет команд</div>
            <div style={styles.muted}>Схему поля выберете после драфта тренера — с подсказкой по приоритету тренера.</div>
          </div>
          <div style={styles.teamFormations}>
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
                  onPickScheme={(scheme) => props.onSetTeamColorScheme(teamId, scheme)}
                  onPickFormation={() => {}}
                />
              );
            })}
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.actions}>
            <button type="button" onClick={props.onStart} style={styles.primaryBtn}>
              Начать игру
            </button>
          </div>
        </div>

        <div style={styles.versionFoot}>Версия {APP_VERSION}</div>
      </div>
    </div>
      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
      {devModalOpen ? (
        <div
          style={styles.devModalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dev-modal-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleDevModalClose();
          }}
        >
          <div style={styles.devModalCard} onMouseDown={(e) => e.stopPropagation()}>
            <div id="dev-modal-title" style={styles.devModalTitle}>
              Режим разработки
            </div>
            <div style={styles.devModalSub}>Введите пароль</div>
            <input
              type="password"
              value={devPassword}
              onChange={(e) => setDevPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleDevSubmit();
              }}
              style={styles.devModalInput}
              autoFocus
              autoComplete="off"
            />
            <div style={styles.devModalActions}>
              <button type="button" onClick={handleDevModalClose} style={styles.devModalBtnGhost}>
                Отмена
              </button>
              <button type="button" onClick={handleDevSubmit} style={styles.devModalBtnPrimary}>
                Войти
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

const baseStyles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: 24,
  },
  card: {
    width: 'min(980px, 100%)',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 20,
    backdropFilter: 'blur(10px)',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'start',
    flexWrap: 'wrap',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    marginLeft: 'auto',
  },
  devCheckboxLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    fontWeight: 650,
    opacity: 0.92,
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  },
  devCheckbox: {
    width: 16,
    height: 16,
    accentColor: '#6ea0ff',
    cursor: 'pointer',
  },
  devModalOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 10000,
    display: 'grid',
    placeItems: 'center',
    padding: 16,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(6px)',
  },
  devModalCard: {
    width: 'min(400px, 100%)',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(18,22,32,0.96)',
    padding: 18,
    boxShadow: '0 18px 60px rgba(0,0,0,0.45)',
  },
  devModalTitle: { fontSize: 18, fontWeight: 800, letterSpacing: -0.2 },
  devModalSub: { marginTop: 6, opacity: 0.75, fontSize: 13 },
  devModalInput: {
    width: '100%',
    marginTop: 12,
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(0,0,0,0.35)',
    color: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  },
  devModalActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14, flexWrap: 'wrap' },
  devModalBtnGhost: {
    padding: '9px 12px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    fontWeight: 650,
  },
  devModalBtnPrimary: {
    padding: '9px 14px',
    borderRadius: 12,
    border: '1px solid rgba(128,168,255,0.8)',
    background: 'rgba(68,120,255,0.35)',
    color: 'inherit',
    cursor: 'pointer',
    fontWeight: 650,
  },
  rulesBtn: {
    padding: '9px 14px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(0,0,0,0.18)',
    color: 'inherit',
    cursor: 'pointer',
    fontWeight: 650,
    fontSize: 14,
    flexShrink: 0,
  },
  h1: { fontSize: 28, fontWeight: 700, letterSpacing: -0.2 },
  sub: { opacity: 0.85, marginTop: 6 },
  section: { marginTop: 18 },
  hintsFormatRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 20,
    alignItems: 'flex-start',
  },
  hintsFormatCol: {
    flex: '1 1 240px',
    minWidth: 0,
  },
  labelRow: { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' },
  label: { fontWeight: 650 },
  labelMuted: { fontSize: 12, fontWeight: 650, opacity: 0.8 },
  modeHelpBox: {
    marginTop: 10,
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(0,0,0,0.16)',
    fontSize: 13,
    lineHeight: 1.45,
    opacity: 0.92,
  },
  modeRow: { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 },
  modeBtn: {
    padding: '9px 12px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(0,0,0,0.18)',
    color: 'inherit',
    cursor: 'pointer',
    opacity: 0.92,
    fontWeight: 650,
  },
  modeBtnActive: { border: '1px solid rgba(128,168,255,0.75)', background: 'rgba(68,120,255,0.18)' },
  teamCountRow: { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 },
  countBtn: {
    padding: '8px 12px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(0,0,0,0.18)',
    color: 'inherit',
    cursor: 'pointer',
    minWidth: 44,
    opacity: 0.92,
    fontWeight: 700,
  },
  countBtnActive: { border: '1px solid rgba(128,168,255,0.75)', background: 'rgba(68,120,255,0.18)' },
  teamFormations: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 },
  teamBox: {
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(0,0,0,0.10)',
    padding: 12,
  },
  teamNameDisplay: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(0,0,0,0.18)',
    fontWeight: 700,
    letterSpacing: -0.2,
  },
  schemeRowWithGap: { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10, marginBottom: 12 },
  schemeBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(0,0,0,0.18)',
    color: 'inherit',
    cursor: 'pointer',
    opacity: 0.92,
  },
  schemeBtnActive: { border: '1px solid rgba(128,168,255,0.75)', background: 'rgba(68,120,255,0.18)' },
  schemeDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    border: '1px solid rgba(0,0,0,0.35)',
    boxShadow: '0 0 0 2px rgba(255,255,255,0.08) inset',
  },
  formationGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 },
  formationCard: {
    textAlign: 'left',
    padding: 10,
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(0,0,0,0.22)',
    color: 'inherit',
    cursor: 'pointer',
  },
  formationCardActive: { border: '1px solid rgba(128,168,255,0.75)', background: 'rgba(68,120,255,0.18)' },
  formationCardDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  formationCardTop: { display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  formationName: { fontWeight: 800, letterSpacing: -0.2 },
  actions: { display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' },
  primaryBtn: {
    padding: '10px 14px',
    borderRadius: 12,
    border: '1px solid rgba(128,168,255,0.8)',
    background: 'rgba(68,120,255,0.35)',
    color: 'inherit',
    cursor: 'pointer',
    fontWeight: 650,
  },
  muted: { opacity: 0.75, fontSize: 13 },
  hintsPanel: {
    marginTop: 12,
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(0,0,0,0.14)',
    overflow: 'hidden',
  },
  hintsPanelToggle: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    border: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(0,0,0,0.12)',
    color: 'inherit',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 14,
    textAlign: 'left',
  },
  hintsPanelChevron: {
    display: 'inline-flex',
    width: 18,
    justifyContent: 'center',
    opacity: 0.85,
    fontSize: 12,
  },
  hintsPanelBody: {
    padding: 14,
  },
  versionFoot: { marginTop: 16, fontSize: 12, opacity: 0.55, textAlign: 'center' },
};
