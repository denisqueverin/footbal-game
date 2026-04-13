import { formationRowsForDisplay, type FormationId } from '@/entities/game/core/formations';
import { FORMATION_PITCH_TRACKS, pitchSlotGridColumn } from '@/shared/lib/formationPitchGrid';

export interface FormationPreviewProps {
  formation: FormationId;
}

export function FormationPreview(props: FormationPreviewProps) {
  const rows = formationRowsForDisplay(props.formation);

  return (
    <div className="formation-preview" aria-hidden="true">
      <div
        className="formation-preview-pitch"
        style={{ gridTemplateRows: `repeat(${rows.length}, minmax(0, 1fr))` }}
      >
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="formation-preview-row"
            style={{
              gridTemplateColumns: `repeat(${FORMATION_PITCH_TRACKS}, minmax(0, 1fr))`,
            }}
          >
            {row.map((cell, colIdx) => (
              <div
                key={cell.slotId}
                className="formation-preview-dot"
                style={{ gridColumn: pitchSlotGridColumn(row.length, colIdx) }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
