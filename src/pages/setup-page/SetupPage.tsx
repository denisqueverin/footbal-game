import { useState, type CSSProperties } from 'react';

import { RulesModal } from '@/shared/ui/rules-modal';

import { FORMATIONS, type FormationId } from '@/entities/game/formations';
import type { ColorSchemeId, GameMode, HintsBudget, TeamCount, TeamId, TeamState } from '@/entities/game/types';

import { FormationPreview } from '@/shared/ui/formation-preview';

import { APP_VERSION } from '@/shared/config/version';

import {
  SETUP_BEST_LINEUP_BENCH_OPTIONS,
  SETUP_HINT_BUDGETS,
  SETUP_MODE_OPTIONS,
  SETUP_SCHEME_OPTIONS,
  SETUP_TEAM_COUNTS,
} from './setup-page.constants';
import { formationLabelShort } from './setup-page.utils';

export interface SetupPageProps {
  formationLocked: boolean;
  teamOrder: TeamId[];
  teams: Record<TeamId, TeamState>;
  mode: GameMode;
  onSetTeamFormation: (team: TeamId, formation: FormationId) => void;
  onSetTeamColorScheme: (team: TeamId, scheme: ColorSchemeId) => void;
  onSetTeamCount: (count: TeamCount) => void;
  onSetMode: (mode: GameMode) => void;
  hintsBudget: HintsBudget;
  onSetHintsBudget: (budget: HintsBudget) => void;
  bestLineupIncludeBench: boolean;
  onSetBestLineupIncludeBench: (includeBench: boolean) => void;
  onStart: () => void;
}

interface CountButtonProps {
  count: TeamCount;
  isActive: boolean;
  onPick: () => void;
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
      style={{ ...styles.countBtn, ...(props.isActive ? styles.countBtnActive : null) }}
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
      style={{ ...styles.countBtn, ...(props.isActive ? styles.countBtnActive : null) }}
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
      style={{ ...styles.schemeBtn, ...(props.isActive ? styles.schemeBtnActive : null) }}
      aria-pressed={props.isActive}
    >
      <span style={{ ...styles.schemeDot, background: schemeDotColor(props.schemeId) }} aria-hidden="true" />
      {props.label}
    </button>
  );
}

function schemeDotColor(schemeId: ColorSchemeId): string {
  switch (schemeId) {
    case 'green':
      return 'rgba(38,145,80,0.95)';
    case 'red':
      return 'rgba(190,48,58,0.95)';
    case 'blue':
      return 'rgba(45,92,200,0.95)';
    case 'white':
      return 'rgba(240,240,245,0.95)';
    default:
      return 'rgba(255,255,255,0.9)';
  }
}

interface TeamBoxProps {
  teamName: string;
  activeFormation: FormationId;
  colorScheme: ColorSchemeId;
  isFormationDisabled: boolean;
  onPickScheme: (scheme: ColorSchemeId) => void;
  onPickFormation: (formation: FormationId) => void;
}

function TeamBox(props: TeamBoxProps) {
  return (
    <div style={styles.teamBox}>
      <div style={styles.teamNameDisplay}>{props.teamName}</div>
      <div style={styles.schemeRowWithGap}>
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
      <div style={styles.formationGrid}>
        {(Object.keys(FORMATIONS) as FormationId[]).map((formationId) => (
          <button
            key={formationId}
            type="button"
            onClick={() => props.onPickFormation(formationId)}
            disabled={props.isFormationDisabled}
            style={{
              ...styles.formationCard,
              ...(props.activeFormation === formationId ? styles.formationCardActive : null),
              ...(props.isFormationDisabled ? styles.formationCardDisabled : null),
            }}
            title={formationLabelShort(formationId)}
          >
            <div style={styles.formationCardTop}>
              <div style={styles.formationName}>{formationLabelShort(formationId)}</div>
            </div>
            <FormationPreview formation={formationId} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function SetupPage(props: SetupPageProps) {
  const [rulesOpen, setRulesOpen] = useState(false);

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
            <div style={styles.label}>Режим</div>
          </div>
          <div style={styles.modeRow}>
            {SETUP_MODE_OPTIONS.map((option) => (
              <button
                key={option.mode}
                type="button"
                onClick={() => props.onSetMode(option.mode)}
                style={{
                  ...styles.modeBtn,
                  ...(props.mode === option.mode ? styles.modeBtnActive : null),
                }}
                aria-pressed={props.mode === option.mode}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.labelRow}>
            <div style={styles.label}>Игроков</div>
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

        <div style={styles.section}>
          <div style={styles.hintsFormatRow}>
            <div style={styles.hintsFormatCol}>
              <div style={styles.labelRow}>
                <div style={styles.label}>Подсказки «Лучший состав» на команду за игру</div>
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
                <div style={styles.label}>Формат «Лучший состав» в подсказке</div>
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
        </div>

        <div style={styles.section}>
          <div style={styles.labelRow}>
            <div style={styles.label}>Схема (каждая команда выбирает свою)</div>
            {props.formationLocked ? <div style={styles.muted}>Смена схемы заблокирована после первого выбора</div> : null}
          </div>
          <div style={styles.teamFormations}>
            {props.teamOrder.map((teamId) => {
              const team = props.teams[teamId];

              return (
                <TeamBox
                  key={teamId}
                  teamName={team.name}
                  activeFormation={team.formation}
                  colorScheme={team.colorScheme}
                  isFormationDisabled={props.formationLocked}
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

const styles: Record<string, CSSProperties> = {
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
  versionFoot: { marginTop: 16, fontSize: 12, opacity: 0.55, textAlign: 'center' },
};
