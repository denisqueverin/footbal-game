import type { FormationId } from '../game/formations'
import { FORMATIONS } from '../game/formations'
import { FormationPreview } from '../ui/FormationPreview'
import type { TeamId } from '../game/types'
import { TeamSetup } from './TeamSetup'

type Props = {
  formationLocked: boolean
  team1Formation: FormationId
  team2Formation: FormationId
  team3Formation: FormationId
  team4Formation: FormationId
  team1Name: string
  team2Name: string
  team3Name: string
  team4Name: string
  team1Color: string
  team2Color: string
  team3Color: string
  team4Color: string
  onSetTeamFormation: (team: TeamId, formation: FormationId) => void
  onSetTeamName: (team: TeamId, name: string) => void
  onSetTeamColor: (team: TeamId, color: string) => void
  onStart: () => void
}

export function SetupScreen(props: Props) {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <div style={styles.h1}>Футбольный драфт</div>
            <div style={styles.sub}>
              Введите 20 стран (по одной в строке). Дальше они будут выпадать случайно без повторов.
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.labelRow}>
            <div style={styles.label}>Схема (каждая команда выбирает свою)</div>
            {props.formationLocked ? (
              <div style={styles.muted}>Смена схемы заблокирована после первого выбора</div>
            ) : null}
          </div>
          <div style={styles.teamFormations}>
            <TeamFormationPicker
              title="Команда 1"
              activeFormation={props.team1Formation}
              disabled={props.formationLocked}
              onPick={(formation) => props.onSetTeamFormation('team1', formation)}
            />
            <TeamFormationPicker
              title="Команда 2"
              activeFormation={props.team2Formation}
              disabled={props.formationLocked}
              onPick={(formation) => props.onSetTeamFormation('team2', formation)}
            />
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.labelRow}>
            <div style={styles.label}>Команды</div>
            <button
              type="button"
              style={styles.addButton}
              onClick={() => {}}
            >
              +
            </button>
            {false && <TeamSetup
              teamId="Команда 3"
              teamName={props.team3Name}
              color={props.team3Color}
              onNameChange={(value) => props.onSetTeamName('team3', value)}
              onColorChange={(value) => props.onSetTeamColor('team3', value)}
            />}
            {false && <TeamSetup
              teamId="Команда 4"
              teamName={props.team4Name}
              color={props.team4Color}
              onNameChange={(value) => props.onSetTeamName('team4', value)}
              onColorChange={(value) => props.onSetTeamColor('team4', value)}
            />}
          </div>
          <div style={styles.teamSetupGrid}>
            <TeamSetup
              teamId="Команда 1"
              teamName={props.team1Name}
              color={props.team1Color}
              onNameChange={(value) => props.onSetTeamName('team1', value)}
              onColorChange={(value) => props.onSetTeamColor('team1', value)}
            />
            <TeamSetup
              teamId="Команда 2"
              teamName={props.team2Name}
              color={props.team2Color}
              onNameChange={(value) => props.onSetTeamName('team2', value)}
              onColorChange={(value) => props.onSetTeamColor('team2', value)}
            />
          </div>
        </div>



        <div style={styles.section}>
          <div style={styles.actions}>
            <button
              type="button"
              onClick={() => props.onStart()}
              style={styles.primaryBtn}
            >
              Начать игру
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TeamFormationPicker(props: {
  title: string
  activeFormation: FormationId
  disabled: boolean
  onPick: (formation: FormationId) => void
}) {
  return (
    <div style={styles.teamBox}>
      <div style={styles.teamTitle}>{props.title}</div>
      <div style={styles.formationGrid}>
        {(Object.keys(FORMATIONS) as FormationId[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => props.onPick(id)}
            disabled={props.disabled}
            style={{
              ...styles.formationCard,
              ...(props.activeFormation === id ? styles.formationCardActive : null),
              ...(props.disabled ? styles.formationCardDisabled : null),
            }}
            title={id}
          >
            <div style={styles.formationCardTop}>
              <div style={styles.formationName}>{id}</div>
            </div>
            <FormationPreview formation={id} />
          </button>
        ))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
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
  headerRow: { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start' },
  h1: { fontSize: 28, fontWeight: 700, letterSpacing: -0.2 },
  sub: { opacity: 0.85, marginTop: 6 },
  section: { marginTop: 18 },
  labelRow: { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' },
  label: { fontWeight: 650 },
  counter: { opacity: 0.85 },
  teamFormations: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 },
  teamSetupGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 },
  teamBox: {
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(0,0,0,0.10)',
    padding: 12,
  },
  addButton: {
    padding: '4px 8px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(0,0,0,0.22)',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 600,
  },
  teamTitle: { fontWeight: 750, marginBottom: 10 },
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
  secondaryBtn: {
    padding: '9px 12px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(0,0,0,0.18)',
    color: 'inherit',
    cursor: 'pointer',
    opacity: 0.95,
  },
  muted: { opacity: 0.75, fontSize: 13 },
}

