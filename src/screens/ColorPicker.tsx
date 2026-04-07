type ColorOption = {
  value: string
  label: string
  color: string
}

const COLORS: ColorOption[] = [
  { value: 'green', label: 'Зелёный', color: '#269150' },
  { value: 'red', label: 'Красный', color: 'rgba(255,0,0,0.3)' },
  { value: 'blue', label: 'Синий', color: 'rgba(0,0,255,0.3)' },
  { value: 'white', label: 'Белый', color: 'rgba(255,255,255,0.3)' },
  { value: 'black', label: 'Чёрный', color: 'rgba(0,0,0,0.3)' },
]

type Props = {
  value: string
  onChange: (value: string) => void
}

export function ColorPicker(props: Props) {
  return (
    <div style={styles.container}>
      <div style={styles.label}>Цвет фона команды</div>
      <div style={styles.grid}>
        {COLORS.map((color) => (
          <label
            key={color.value}
            style={{
              ...styles.option,
              ...(props.value === color.value ? styles.optionActive : null),
            }}
          >
            <input
              type="radio"
              name="color"
              value={color.value}
              checked={props.value === color.value}
              onChange={() => props.onChange(color.value)}
              style={{ display: 'none' }}
            />
            <div style={{ ...styles.colorPreview, background: color.color }} />
            {color.label}
          </label>
        ))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { marginTop: 12 },
  label: { fontWeight: 650, marginBottom: 8 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 },
  option: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(0,0,0,0.22)',
    cursor: 'pointer',
    textAlign: 'center',
  },
  optionActive: { border: '1px solid rgba(128,168,255,0.75)', background: 'rgba(68,120,255,0.18)' },
  colorPreview: { width: 40, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.18)' },
}
