import type { GameState } from '../game/types'
import { FORMATIONS, type FormationLayout } from '../game/formations'

type Props = {
  state: GameState
  onReset: () => void
}

export function ResultScreen(props: Props) {
  const { state } = props
  const rowsTeam1 = FORMATIONS[state.teams.team1.formation].rows
  const rowsTeam2 = FORMATIONS[state.teams.team2.formation].rows

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.h1}>Игра завершена</div>
        <div style={styles.sub}>
          Команда 1: {state.teams.team1.formation} · Команда 2: {state.teams.team2.formation}
        </div>

        <div style={styles.grid}>
          <TeamSummary title="Команда 1" rows={rowsTeam1} picks={state.teams.team1.picksBySlotId} />
          <TeamSummary title="Команда 2" rows={rowsTeam2} picks={state.teams.team2.picksBySlotId} />
        </div>

        <div style={styles.actions}>
          <button type="button" onClick={props.onReset} style={styles.primaryBtn}>
            Новая игра
          </button>
        </div>
      </div>
    </div>
  )
}

function TeamSummary(props: {
  title: string
  rows: FormationLayout
  picks: Record<string, { playerName: string | null; country: string | null; label: string }>
}) {
  return (
    <div style={styles.team}>
      <div style={styles.teamTitle}>{props.title}</div>
      <div style={styles.list}>
        {props.rows.flatMap((row) =>
          row.map((cell) => {
            const p = props.picks[cell.slotId]
            const name = p?.playerName ?? '—'
            const country = p?.country ? ` (${p.country})` : ''
            return (
              <div key={cell.slotId} style={styles.item}>
                <span style={styles.badge}>{cell.label}</span>
                <span style={styles.itemText}>
                  {name}
                  <span style={styles.muted}>{country}</span>
                </span>
              </div>
            )
          }),
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
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
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 16 },
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
}

