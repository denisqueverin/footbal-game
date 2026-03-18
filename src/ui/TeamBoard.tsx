import { FORMATIONS, type FormationId } from '../game/formations'
import type { TeamState } from '../game/types'
import { getCountryFlagUrlRu } from '../game/topCountries'

type Props = {
  team: TeamState
  formation: FormationId
  disabled: boolean
  selectedSlotId: string | null
  onSelectSlot?: (slotId: string) => void
}

export function TeamBoard(props: Props) {
  const rows = FORMATIONS[props.formation].rows

  return (
    <div
      style={{
        ...styles.card,
        ...(props.disabled ? styles.cardDisabled : null),
      }}
      aria-disabled={props.disabled}
    >
      <div style={styles.header}>
        <div style={styles.teamName}>{props.team.name}</div>
        <div style={styles.small}>{props.formation}</div>
      </div>

      <div style={styles.pitch}>
        {rows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            style={{
              ...styles.row,
              gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))`,
            }}
          >
            {row.map((cell) => {
              const pick = props.team.picksBySlotId[cell.slotId]
              const isSelected = props.selectedSlotId === cell.slotId
              const isTaken = Boolean(pick?.playerName)
              const flagUrl = getCountryFlagUrlRu(pick?.country)
              return (
                <button
                  key={cell.slotId}
                  type="button"
                  disabled={props.disabled || isTaken}
                  onClick={() => props.onSelectSlot?.(cell.slotId)}
                  style={{
                    ...styles.slot,
                    ...(isTaken ? styles.slotTaken : null),
                    ...(isSelected ? styles.slotSelected : null),
                    ...(props.disabled ? styles.slotDisabled : null),
                  }}
                  title={isTaken ? `${pick.playerName} (${pick.country ?? '—'})` : 'Выбрать слот'}
                >
                  <div style={styles.slotLabel}>
                    {cell.label}
                    {flagUrl ? (
                      <img
                        src={flagUrl}
                        alt={pick?.country ?? ''}
                        style={styles.flagImg}
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                  <div style={styles.slotName}>{pick?.playerName ?? '—'}</div>
                  <div style={styles.slotCountry}>{pick?.country ?? ''}</div>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    height: '100%',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  cardDisabled: { opacity: 0.92 },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    padding: 12,
    borderBottom: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(0,0,0,0.14)',
  },
  teamName: { fontWeight: 800, letterSpacing: -0.2 },
  small: { opacity: 0.75, fontSize: 13 },
  pitch: {
    flex: '1 1 auto',
    padding: 12,
    display: 'grid',
    gap: 12,
    background:
      'linear-gradient(180deg, rgba(38,145,80,0.25), rgba(38,145,80,0.10)), radial-gradient(circle at 30% 0%, rgba(255,255,255,0.06), transparent 55%)',
  },
  row: { display: 'grid', gap: 10 },
  slot: {
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(0,0,0,0.22)',
    padding: 10,
    textAlign: 'center',
    color: 'inherit',
    cursor: 'pointer',
    minHeight: 78,
    display: 'grid',
    alignContent: 'center',
    gap: 3,
  },
  slotDisabled: { cursor: 'not-allowed' },
  slotTaken: { border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(0,0,0,0.32)' },
  slotSelected: { border: '1px solid rgba(128,168,255,0.75)', background: 'rgba(68,120,255,0.18)' },
  slotLabel: { fontSize: 12, opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 },
  slotName: { fontWeight: 750, fontSize: 14, lineHeight: 1.15 },
  slotCountry: { fontSize: 12, opacity: 0.75 },
  flagImg: {
    width: 18,
    height: 12,
    objectFit: 'cover',
    borderRadius: 2,
    border: '1px solid rgba(0,0,0,0.4)',
    backgroundColor: '#000',
  },
}

