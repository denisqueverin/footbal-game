import { useCallback, useMemo, useState, type CSSProperties } from 'react';

import { useMediaQuery } from '@/shared/lib/useMediaQuery';

import { RulesModal } from '@/shared/ui/rules-modal';

import { FORMATIONS, type FormationId } from '@/entities/game/core/formations';
import type {
  ColorSchemeId,
  GameKind,
  CpuDifficulty,
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
  SETUP_BEST_LINEUP_BENCH_OPTIONS,
  SETUP_HINT_BUDGETS,
  SETUP_MODE_GROUP_DESCRIPTIONS,
  SETUP_RANDOM_PLAYER_HINT_BUDGETS,
  SETUP_SCHEME_OPTIONS,
  SETUP_TEAM_COUNTS,
  getSetupModeGroupId,
} from './setup-page.constants';
import { formationLabelShort } from './setup-page.utils';

export interface SetupPageProps {
  formationLocked: boolean;
  teamOrder: TeamId[];
  teams: Record<TeamId, TeamState>;
  mode: GameMode;
  gameKind: GameKind;
  cpuDifficulty: CpuDifficulty;
  teamControllers: Record<TeamId, TeamController>;
  onSetTeamController: (team: TeamId, controller: TeamController) => void;
  onSetTeamFormation: (team: TeamId, formation: FormationId) => void;
  onSetTeamColorScheme: (team: TeamId, scheme: ColorSchemeId) => void;
  onSetTeamCount: (count: TeamCount) => void;
  onSetMode: (mode: GameMode) => void;
  onSetGameKind: (gameKind: GameKind) => void;
  onSetCpuDifficulty: (difficulty: CpuDifficulty) => void;
  hintsBudget: HintsBudget;
  onSetHintsBudget: (budget: HintsBudget) => void;
  randomPlayerHintsBudget: RandomPlayerHintsBudget;
  onSetRandomPlayerHintsBudget: (budget: RandomPlayerHintsBudget) => void;
  bestLineupIncludeBench: boolean;
  onSetBestLineupIncludeBench: (includeBench: boolean) => void;
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
  /** Узкая вёрстка: одна колонка сетки схем */
  narrowLayout?: boolean;
  onPickScheme: (scheme: ColorSchemeId) => void;
  onPickFormation: (formation: FormationId) => void;
}

function TeamBox(props: TeamBoxProps) {
  return (
    <div style={baseStyles.teamBox}>
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
      {props.hideFormationPicker ? (
        <div style={baseStyles.muted}>Схему выберет компьютер при старте игры</div>
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
      )}
    </div>
  );
}

export function SetupPage(props: SetupPageProps) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [hintsSettingsOpen, setHintsSettingsOpen] = useState(true);
  const isNarrow = useMediaQuery('(max-width: 640px)');
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
        gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr',
      },
    };
  }, [isNarrow]);

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

  const anyCpuActive = useMemo(() => {
    return props.teamOrder.some((id) => isCpuTeam(id));
  }, [isCpuTeam, props.teamOrder]);

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

  return (
    <>
      <div style={styles.page}>
        <div style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <div style={styles.h1}>Футбольный драфт</div>
            <div style={styles.sub}>
              Выберите режим и количество игроков, затем настройте команды и начните игру.
            </div>
          </div>
          <button type="button" onClick={() => setRulesOpen(true)} style={styles.rulesBtn}>
            Правила
          </button>
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
          <div style={styles.modeHelpBox}>{SETUP_MODE_GROUP_DESCRIPTIONS[modeGroupId]}</div>

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
        </div>

        <div style={styles.section}>
          <div style={styles.labelRow}>
            <div style={styles.label}>Режим партии</div>
            <div style={styles.muted}>
              «Против компьютера» фиксирует 2 команды, схема компьютера выбирается случайно
            </div>
          </div>
          <div style={styles.modeRow}>
            <button
              type="button"
              onClick={() => props.onSetGameKind('vsCpu')}
              style={{
                ...styles.modeBtn,
                ...(props.gameKind === 'vsCpu' ? styles.modeBtnActive : null),
              }}
              aria-pressed={props.gameKind === 'vsCpu'}
            >
              Против компьютера (1 игрок)
            </button>
            <button
              type="button"
              onClick={() => props.onSetGameKind('multi')}
              style={{
                ...styles.modeBtn,
                ...(props.gameKind === 'multi' ? styles.modeBtnActive : null),
              }}
              aria-pressed={props.gameKind === 'multi'}
            >
              Несколько игроков
            </button>
          </div>
        </div>

        {props.gameKind === 'multi' ? (
          <div style={styles.section}>
            <div style={styles.labelRow}>
              <div style={styles.label}>Количество игроков</div>
            </div>
            <div style={styles.teamCountRow}>
              {SETUP_TEAM_COUNTS.map((count) => (
                <CountButton
                  key={count}
                  count={count}
                  isActive={props.teamOrder.length === count}
                  onPick={() => props.onSetTeamCount(count)}
                />
              ))}
            </div>
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
                return (
                  <div key={teamId} style={styles.teamBox}>
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
                    {controller === 'cpu' ? (
                      <div style={styles.muted}>Схему выберет компьютер при старте игры</div>
                    ) : (
                      <div style={styles.muted}>Ходы этой команды делаете вы</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {anyCpuActive ? (
          <div style={styles.section}>
            <div style={styles.labelRow}>
              <div style={styles.label}>Сложность компьютера</div>
              <div style={styles.muted}>Влияет на выбор игроков по уровню (★)</div>
            </div>
            <div style={styles.modeRow}>
              <button
                type="button"
                onClick={() => props.onSetCpuDifficulty('beginner')}
                style={{
                  ...styles.modeBtn,
                  ...(props.cpuDifficulty === 'beginner' ? styles.modeBtnActive : null),
                }}
                aria-pressed={props.cpuDifficulty === 'beginner'}
              >
                Начинающий
              </button>
              <button
                type="button"
                onClick={() => props.onSetCpuDifficulty('normal')}
                style={{
                  ...styles.modeBtn,
                  ...(props.cpuDifficulty === 'normal' ? styles.modeBtnActive : null),
                }}
                aria-pressed={props.cpuDifficulty === 'normal'}
              >
                Нормальный
              </button>
              <button
                type="button"
                onClick={() => props.onSetCpuDifficulty('hard')}
                style={{
                  ...styles.modeBtn,
                  ...(props.cpuDifficulty === 'hard' ? styles.modeBtnActive : null),
                }}
                aria-pressed={props.cpuDifficulty === 'hard'}
              >
                Хард
              </button>
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
                        {SETUP_HINT_BUDGETS.map((budget) => (
                          <HintBudgetButton
                            key={budget}
                            budget={budget}
                            isActive={props.hintsBudget === budget}
                            onPick={() => props.onSetHintsBudget(budget)}
                          />
                        ))}
                      </div>
                    </div>
                    <div style={styles.hintsFormatCol}>
                      <div style={styles.labelRow}>
                        <div style={styles.label}>Формат «Лучший состав»</div>
                      </div>
                      <div style={styles.modeRow}>
                        {SETUP_BEST_LINEUP_BENCH_OPTIONS.map((option) => (
                          <button
                            key={String(option.includeBench)}
                            type="button"
                            onClick={() => props.onSetBestLineupIncludeBench(option.includeBench)}
                            style={{
                              ...styles.modeBtn,
                              ...(props.bestLineupIncludeBench === option.includeBench ? styles.modeBtnActive : null),
                            }}
                            aria-pressed={props.bestLineupIncludeBench === option.includeBench}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {randomHintsSupported ? (
                    <div style={{ marginTop: 16 }}>
                      <div style={styles.labelRow}>
                        <div style={styles.label}>«Случайный игрок» на команду за игру</div>
                        <div style={styles.muted}>0 — не использовать эту подсказку</div>
                      </div>
                      <div style={styles.teamCountRow}>
                        {SETUP_RANDOM_PLAYER_HINT_BUDGETS.map((budget) => (
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
            <div style={styles.label}>Схема (каждая команда выбирает свою)</div>
            {props.formationLocked ? <div style={styles.muted}>Смена схемы заблокирована после первого выбора</div> : null}
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
                  isFormationDisabled={props.formationLocked || cpu}
                  hideFormationPicker={cpu}
                  narrowLayout={isNarrow}
                  onPickScheme={(scheme) => props.onSetTeamColorScheme(teamId, scheme)}
                  onPickFormation={(formation) => props.onSetTeamFormation(teamId, formation)}
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
