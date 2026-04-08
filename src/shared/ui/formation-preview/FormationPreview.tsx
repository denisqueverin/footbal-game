import type { CSSProperties } from 'react';

import { formationRowsForDisplay, type FormationId } from '@/entities/game/core/formations';

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
    border: '1px solid rgba(255, 255, 255, 0.14)',
    background: `
      repeating-linear-gradient(90deg, transparent 0, transparent 40px, rgba(0,0,0,0.05) 40px, rgba(0,0,0,0.05) 80px),
      linear-gradient(180deg, rgba(38, 145, 80, 0.32) 0%, rgba(18, 72, 44, 0.2) 100%),
      radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.08), transparent 55%)
    `,
    padding: 10,
    display: 'grid',
    gap: 6,
    position: 'relative',
  },
  row: { display: 'grid', gap: 6 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: 'rgba(248, 252, 248, 0.92)',
    border: '1px solid rgba(0, 0, 0, 0.2)',
    boxShadow: '0 0 0 1px rgba(62, 224, 143, 0.15)',
    justifySelf: 'center',
  },
};
