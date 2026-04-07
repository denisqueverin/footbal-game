import { useCallback, useState, type CSSProperties } from 'react';

import { FORMATIONS, type FormationId } from '@/entities/game/formations';
import type { ColorSchemeId, GameState, TeamId } from '@/entities/game/types';

import { ConfirmNewGameModal } from '@/shared/ui/confirm-new-game-modal';
import { schemeAccent, schemeDotColor } from '@/shared/lib/schemeAccent';

import { SETUP_MODE_OPTIONS, SETUP_SCHEME_OPTIONS } from '@/pages/setup-page/setup-page.constants';
import { formationLabelShort } from '@/pages/setup-page/setup-page.utils';

export interface ResultPageProps {
  state: GameState;
  onReset: () => void;
}

const SIMULATION_PROMPT = `Сделай глубокую симуляцию чемпионата (каждая команда играет 50 матчей дома, 50 в гостях, по очереди)
Кто выиграет чемпионат?
Кто лучшие и худшие игроки обеих команд?
Кто лучшие бомбардиры? У кого больше Желтых Красных карточек?
Почему выиграла команда, а почему другая проиграла?`;

function schemeLabel(colorScheme: ColorSchemeId): string {
  return SETUP_SCHEME_OPTIONS.find((o) => o.id === colorScheme)?.label ?? colorScheme;
}

function buildResultExportText(state: GameState): string {
  const modeLabel =
    SETUP_MODE_OPTIONS.find((o) => o.mode === state.mode)?.label ?? String(state.mode);

  const lines: string[] = [
    'Игра завершена',
    'Итоги по командам и выбранным схемам.',
    '',
    `Режим: ${modeLabel}`,
    '',
  ];

  for (const teamId of state.teamOrder) {
    const team = state.teams[teamId];
    const formationShort = formationLabelShort(team.formation);
    lines.push(`— ${team.name} —`);
    lines.push(`Схема: ${formationShort}`);
    const rows = FORMATIONS[team.formation].rows;
    for (const row of rows) {
      for (const cell of row) {
        const pick = team.picksBySlotId[cell.slotId];
        const name = pick?.playerName ?? '—';
        const country = pick?.country ? ` (${pick.country})` : '';
        lines.push(`  ${cell.label}: ${name}${country}`);
      }
    }
    lines.push('');
  }

  lines.push(SIMULATION_PROMPT);
  return lines.join('\n');
}

interface TeamSummaryProps {
  title: string;
  colorScheme: ColorSchemeId;
  formationId: FormationId;
  picks: Record<string, { playerName: string | null; country: string | null; label: string }>;
}

function TeamSummary(props: TeamSummaryProps) {
  const rows = FORMATIONS[props.formationId].rows;
  const accent = schemeAccent(props.colorScheme);
  const dot = schemeDotColor(props.colorScheme);

  return (
    <div
      style={{
        ...styles.team,
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <div style={styles.teamTitle}>{props.title}</div>
      <div style={styles.colorRow} aria-label={`Цвет команды: ${schemeLabel(props.colorScheme)}`}>
        <span style={{ ...styles.colorDot, background: dot, boxShadow: `0 0 0 1px ${accent}` }} />
      </div>
      <div style={styles.list}>
        {rows.flatMap((row) =>
          row.map((cell) => {
            const pick = props.picks[cell.slotId];
            const name = pick?.playerName ?? '—';
            const country = pick?.country ? ` (${pick.country})` : '';

            return (
              <div key={cell.slotId} style={styles.item}>
                <span style={{ ...styles.badge, borderColor: accent }}>{cell.label}</span>
                <span style={styles.itemText}>
                  {name}
                  <span style={styles.muted}>{country}</span>
                </span>
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

export function ResultPage(props: ResultPageProps) {
  const { state } = props;
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [copyDone, setCopyDone] = useState(false);

  const handleCopyAll = useCallback(async () => {
    const text = buildResultExportText(state);
    try {
      await navigator.clipboard.writeText(text);
      setCopyDone(true);
      window.setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setCopyDone(false);
    }
  }, [state]);

  return (
    <div style={styles.page}>
      <ConfirmNewGameModal
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={props.onReset}
      />
      <div style={styles.card}>
        <div style={styles.h1}>Игра завершена</div>
        <div style={styles.sub}>Итоги по командам и выбранным схемам.</div>

        <div
          style={{
            ...styles.grid,
            gridTemplateColumns: `repeat(${Math.min(state.teamOrder.length, 4)}, minmax(0, 1fr))`,
          }}
        >
          {state.teamOrder.map((teamId: TeamId) => {
            const team = state.teams[teamId];

            return (
              <TeamSummary
                key={teamId}
                title={team.name}
                colorScheme={team.colorScheme}
                formationId={team.formation}
                picks={team.picksBySlotId}
              />
            );
          })}
        </div>

        <div style={styles.actions}>
          <button type="button" onClick={handleCopyAll} style={styles.secondaryBtn}>
            {copyDone ? 'Скопировано' : 'Скопировать всё'}
          </button>
          <a
            href="https://chat.deepseek.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.linkBtn}
          >
            Перейти к симуляции
          </a>
          <button type="button" onClick={() => setResetConfirmOpen(true)} style={styles.primaryBtn}>
            Новая игра
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 },
  card: {
    width: 'min(1100px, 100%)',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 20,
    backdropFilter: 'blur(10px)',
  },
  h1: { fontSize: 28, fontWeight: 750, letterSpacing: -0.2 },
  sub: { opacity: 0.85, marginTop: 6 },
  grid: { display: 'grid', gap: 14, marginTop: 16 },
  team: {
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 14,
    background: 'rgba(0,0,0,0.18)',
  },
  teamTitle: { fontWeight: 750, marginBottom: 8 },
  colorRow: { display: 'flex', alignItems: 'center', marginBottom: 10 },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
    flexShrink: 0,
  },
  list: { display: 'grid', gap: 8 },
  item: { display: 'flex', gap: 10, alignItems: 'center' },
  badge: {
    fontSize: 12,
    padding: '3px 8px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.16)',
    background: 'rgba(255,255,255,0.06)',
    minWidth: 44,
    textAlign: 'center',
  },
  itemText: { opacity: 0.95 },
  muted: { opacity: 0.75 },
  actions: {
    marginTop: 16,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  secondaryBtn: {
    padding: '10px 14px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'rgba(255,255,255,0.08)',
    color: 'inherit',
    cursor: 'pointer',
    fontWeight: 650,
  },
  linkBtn: {
    padding: '10px 14px',
    borderRadius: 12,
    border: '1px solid rgba(120,200,255,0.45)',
    background: 'rgba(80,160,255,0.15)',
    color: 'inherit',
    cursor: 'pointer',
    fontWeight: 650,
    textDecoration: 'none',
    display: 'inline-block',
  },
  primaryBtn: {
    padding: '10px 14px',
    borderRadius: 12,
    border: '1px solid rgba(128,168,255,0.8)',
    background: 'rgba(68,120,255,0.35)',
    color: 'inherit',
    cursor: 'pointer',
    fontWeight: 650,
  },
};
