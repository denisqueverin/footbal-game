import type { CSSProperties } from 'react';

import { formationRowsForDisplay, type FormationId } from '@/entities/game/formations';

export interface FormationPreviewProps {
  formation: FormationId;
}

export function FormationPreview(props: FormationPreviewProps) {
  const rows = formationRowsForDisplay(props.formation);

  return (
    <div style={styles.pitch} aria-hidden="true">
      {rows.map((row, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            ...styles.row,
            gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))`,
          }}
        >
          {row.map((cell) => (
            <div key={cell.slotId} style={styles.dot} />
          ))}
        </div>
      ))}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  pitch: {
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.12)',
    background:
      'linear-gradient(180deg, rgba(38,145,80,0.22), rgba(38,145,80,0.10)), radial-gradient(circle at 30% 0%, rgba(255,255,255,0.06), transparent 55%)',
    padding: 10,
    display: 'grid',
    gap: 6,
  },
  row: { display: 'grid', gap: 6 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: 'rgba(232,238,252,0.85)',
    border: '1px solid rgba(0,0,0,0.18)',
    justifySelf: 'center',
  },
};
