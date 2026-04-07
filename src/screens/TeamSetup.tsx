import { ColorPicker } from './ColorPicker'

type Props = {
  teamId: string
  teamName: string
  color: string
  onColorChange: (value: string) => void
  onNameChange: (value: string) => void
}

export function TeamSetup(props: Props) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>{props.teamId}</div>
      <input
        type="text"
        value={props.teamName}
        onChange={(e) => props.onNameChange(e.target.value)}
        placeholder="Название команды"
        style={styles.input}
      />
      <ColorPicker value={props.color} onChange={props.onColorChange} />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(0,0,0,0.10)',
    padding: 12,
  },
  header: { fontWeight: 750, marginBottom: 10 },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(0,0,0,0.24)',
    color: 'inherit',
    marginBottom: 12,
  },
}
