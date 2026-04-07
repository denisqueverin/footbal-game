import type { FormationId } from '../game/formations'
import { FORMATIONS } from '../game/formations'
import { FormationPreview } from '../ui/FormationPreview'
import type { ColorSchemeId, GameMode, TeamCount, TeamId, TeamState } from '../game/types'
import { APP_VERSION } from '../version'

type Props = {
  formationLocked: boolean
  teamOrder: TeamId[]
  teams: Record<TeamId, TeamState>
  mode: GameMode
  onSetTeamFormation: (team: TeamId, formation: FormationId) => void
  onSetTeamName: (team: TeamId, name: string) => void
  onSetTeamColorScheme: (team: TeamId, scheme: ColorSchemeId) => void
  onSetTeamCount: (count: TeamCount) => void
  onSetMode: (mode: GameMode) => void
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
              Выберите режим и количество игроков, затем настройте команды и начните игру.
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.labelRow}>
            <div style={styles.label}>Режим</div>
          </div>
          <div style={styles.modeRow}>
            <button
              type="button"
              onClick={() => props.onSetMode('national')}
              style={{ ...styles.modeBtn, ...(props.mode === 'national' ? styles.modeBtnActive : null) }}
              aria-pressed={props.mode === 'national'}
            >
              Сборные
            </button>
            <button
              type="button"
              onClick={() => props.onSetMode('clubs')}
              style={{ ...styles.modeBtn, ...(props.mode === 'clubs' ? styles.modeBtnActive : null) }}
              aria-pressed={props.mode === 'clubs'}
            >
              Клубы
            </button>
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.labelRow}>
            <div style={styles.label}>Игроков</div>
          </div>
          <div style={styles.teamCountRow}>
            <CountButton count={2} active={props.teamOrder.length === 2} onPick={() => props.onSetTeamCount(2)} />
            <CountButton count={3} active={props.teamOrder.length === 3} onPick={() => props.onSetTeamCount(3)} />
            <CountButton count={4} active={props.teamOrder.length === 4} onPick={() => props.onSetTeamCount(4)} />
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
            {props.teamOrder.map((teamId) => {
              const t = props.teams[teamId]
              return (
                <TeamBox
                  key={teamId}
                  teamName={t.name}
                  activeFormation={t.formation}
                  colorScheme={t.colorScheme}
                  disabled={props.formationLocked}
                  onNameChange={(name) => props.onSetTeamName(teamId, name)}
                  onPickScheme={(scheme) => props.onSetTeamColorScheme(teamId, scheme)}
                  onPickFormation={(formation) => props.onSetTeamFormation(teamId, formation)}
                />
              )
            })}
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

        <div style={styles.versionFoot}>Версия {APP_VERSION}</div>
      </div>
    </div>
  )
}

function CountButton(props: { count: TeamCount; active: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onPick}
      style={{ ...styles.countBtn, ...(props.active ? styles.countBtnActive : null) }}
      aria-pressed={props.active}
    >
      {props.count}
    </button>
  )
}

function SchemeButton(props: { id: ColorSchemeId; active: boolean; label: string; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onPick}
      style={{ ...styles.schemeBtn, ...(props.active ? styles.schemeBtnActive : null) }}
      aria-pressed={props.active}
    >
      <span style={{ ...styles.schemeDot, background: schemeDotColor(props.id) }} aria-hidden="true" />
      {props.label}
    </button>
  )
}

function schemeDotColor(id: ColorSchemeId): string {
  switch (id) {
    case 'green':
      return 'rgba(38,145,80,0.95)'
    case 'red':
      return 'rgba(190,48,58,0.95)'
    case 'blue':
      return 'rgba(45,92,200,0.95)'
    case 'white':
      return 'rgba(240,240,245,0.95)'
    default:
      return 'rgba(255,255,255,0.9)'
  }
}

function formationLabel(id: FormationId): string {
  return id.replace(/^1-/, '')
}

function TeamBox(props: {
  teamName: string
  activeFormation: FormationId
  colorScheme: ColorSchemeId
  disabled: boolean
  onNameChange: (name: string) => void
  onPickScheme: (scheme: ColorSchemeId) => void
  onPickFormation: (formation: FormationId) => void
}) {
  return (
    <div style={styles.teamBox}>
      <input
        value={props.teamName}
        onChange={(e) => props.onNameChange(e.target.value)}
        placeholder="Название команды"
        style={styles.teamNameInput}
      />
      <div style={styles.schemeRowWithGap}>
        <SchemeButton id="green" active={props.colorScheme === 'green'} label="Зелёная" onPick={() => props.onPickScheme('green')} />
        <SchemeButton id="red" active={props.colorScheme === 'red'} label="Красная" onPick={() => props.onPickScheme('red')} />
        <SchemeButton id="blue" active={props.colorScheme === 'blue'} label="Синяя" onPick={() => props.onPickScheme('blue')} />
        <SchemeButton id="white" active={props.colorScheme === 'white'} label="Белая" onPick={() => props.onPickScheme('white')} />
      </div>
      <div style={styles.formationGrid}>
        {(Object.keys(FORMATIONS) as FormationId[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => props.onPickFormation(id)}
            disabled={props.disabled}
            style={{
              ...styles.formationCard,
              ...(props.activeFormation === id ? styles.formationCardActive : null),
              ...(props.disabled ? styles.formationCardDisabled : null),
            }}
            title={formationLabel(id)}
          >
            <div style={styles.formationCardTop}>
              <div style={styles.formationName}>{formationLabel(id)}</div>
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
  teamNameInput: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(0,0,0,0.24)',
    color: 'inherit',
    outline: 'none',
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
  versionFoot: { marginTop: 16, fontSize: 12, opacity: 0.55, textAlign: 'center' },
}

