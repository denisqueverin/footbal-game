import { useMemo, useState } from 'react'
import type { GameState, TeamId } from '../game/types'
import { TeamBoard } from '../ui/TeamBoard'

type Props = {
  state: GameState
  onConfirmPick: (team: TeamId, slotId: string, playerName: string) => void
  onReset: () => void
}

export function GameScreen(props: Props) {
  const { state } = props
  const activeTeam = state.turn

  const [playerName, setPlayerName] = useState('')
  const [slotId, setSlotId] = useState<string | null>(null)

  const activeTeamState = state.teams[activeTeam]
  const activeSlotTaken = slotId ? Boolean(activeTeamState.picksBySlotId[slotId]?.playerName) : false

  const canConfirm = useMemo(() => {
    return Boolean(state.currentCountry) && Boolean(slotId) && !activeSlotTaken && playerName.trim().length > 0
  }, [activeSlotTaken, playerName, slotId, state.currentCountry])

  function confirm() {
    if (!slotId) return
    props.onConfirmPick(activeTeam, slotId, playerName)
    setPlayerName('')
    setSlotId(null)
  }

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div>
          <div style={styles.title}>Текущая страна</div>
          <div style={styles.country}>
            <b>{state.currentCountry ?? '—'}</b>
          </div>
        </div>

        <div style={styles.topbarRight}>
          <button type="button" onClick={props.onReset} style={styles.ghostBtn}>
            Новая игра
          </button>
        </div>
      </div>

      <div style={styles.boards}>
        <div style={styles.side}>
          <TeamBoard
            team={state.teams.team1}
            formation={state.teams.team1.formation}
            selectedSlotId={activeTeam === 'team1' ? slotId : null}
            onSelectSlot={activeTeam === 'team1' ? setSlotId : undefined}
            disabled={activeTeam !== 'team1'}
          />
          {activeTeam !== 'team1' ? <div style={styles.overlay} aria-hidden="true" /> : null}
        </div>

        <div style={styles.side}>
          <TeamBoard
            team={state.teams.team2}
            formation={state.teams.team2.formation}
            selectedSlotId={activeTeam === 'team2' ? slotId : null}
            onSelectSlot={activeTeam === 'team2' ? setSlotId : undefined}
            disabled={activeTeam !== 'team2'}
          />
          {activeTeam !== 'team2' ? <div style={styles.overlay} aria-hidden="true" /> : null}
        </div>
      </div>

      <div style={styles.bottom}>
        <div style={styles.formRow}>
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Имя футболиста (свободный ввод)"
            style={styles.input}
          />
          <div style={styles.slotPreview}>
            Слот: <b>{slotId ?? 'не выбран'}</b>
          </div>
          <button
            type="button"
            onClick={confirm}
            disabled={!canConfirm}
            style={{ ...styles.primaryBtn, ...(!canConfirm ? styles.primaryBtnDisabled : null) }}
          >
            Подтвердить
          </button>
        </div>
        <div style={styles.hint}>
          Выберите свободный слот на активной стороне и введите имя игрока, затем нажмите «Подтвердить».
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    padding: '16px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(10px)',
  },
  title: { fontWeight: 750, letterSpacing: -0.2 },
  country: { opacity: 0.9, marginTop: 4 },
  topbarRight: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'end' },
  ghostBtn: {
    padding: '8px 10px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    opacity: 0.85,
  },
  boards: {
    flex: '1 1 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 14,
    padding: 14,
    alignItems: 'stretch',
  },
  side: { position: 'relative', minHeight: 360 },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 16,
    pointerEvents: 'auto',
  },
  bottom: {
    borderTop: '1px solid rgba(255,255,255,0.12)',
    padding: '14px 18px',
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(10px)',
  },
  formRow: { display: 'flex', gap: 10, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' },
  input: {
    flex: '1 1 320px',
    minWidth: 260,
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(0,0,0,0.24)',
    color: 'inherit',
    outline: 'none',
  },
  slotPreview: { opacity: 0.9 },
  primaryBtn: {
    padding: '10px 14px',
    borderRadius: 12,
    border: '1px solid rgba(128,168,255,0.8)',
    background: 'rgba(68,120,255,0.35)',
    color: 'inherit',
    cursor: 'pointer',
    fontWeight: 650,
  },
  primaryBtnDisabled: { opacity: 0.55, cursor: 'not-allowed' },
  hint: { marginTop: 8, opacity: 0.75, fontSize: 13 },
}

