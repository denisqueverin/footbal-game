import type { CSSProperties } from 'react';

import { FORMATIONS, type FormationId } from '@/entities/game/formations';
import type { GameState, TeamId } from '@/entities/game/types';

export interface ResultPageProps {
  state: GameState;
  onReset: () => void;
}

interface TeamSummaryProps {
  title: string;
  formationId: FormationId;
  picks: Record<string, { playerName: string | null; country: string | null; label: string }>;
}

function TeamSummary(props: TeamSummaryProps) {
  const rows = FORMATIONS[props.formationId].rows;

  return (
    <div style={styles.team}>
      <div style={styles.teamTitle}>{props.title}</div>
      <div style={styles.list}>
        {rows.flatMap((row) =>
          row.map((cell) => {
            const pick = props.picks[cell.slotId];
            const name = pick?.playerName ?? '—';
            const country = pick?.country ? ` (${pick.country})` : '';

            return (
              <div key={cell.slotId} style={styles.item}>
                <span style={styles.badge}>{cell.label}</span>
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

  const handleResetClick = () => {
    props.onReset();
  };

  return (
    <div style={styles.page}>
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
                formationId={team.formation}
                picks={team.picksBySlotId}
              />
            );
          })}
        </div>

        <div style={styles.actions}>
          <button type="button" onClick={handleResetClick} style={styles.primaryBtn}>
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
  teamTitle: { fontWeight: 750, marginBottom: 10 },
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
  actions: { marginTop: 16, display: 'flex', justifyContent: 'end' },
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
