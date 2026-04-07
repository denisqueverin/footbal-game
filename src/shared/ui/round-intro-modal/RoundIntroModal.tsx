import type { MouseEvent } from 'react';

import type { GameMode } from '@/entities/game/types';

export interface RoundIntroModalProps {
  round: number;
  sourceLabel: string;
  mode: GameMode;
  open: boolean;
  exiting: boolean;
  onClose: () => void;
}

function stopPanelPointerPropagation(event: MouseEvent<HTMLDivElement>): void {
  event.stopPropagation();
}

export function RoundIntroModal(props: RoundIntroModalProps) {
  if (!props.open) {
    return null;
  }

  const sourceHeading =
    props.mode === 'clubs' ? 'Клуб, из которого вы выбираете' : 'Страна, из которой вы выбираете';

  return (
    <div
      className={`round-modal-backdrop ${props.exiting ? 'round-modal-backdrop--out' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="round-modal-title"
    >
      <div
        className={`round-modal-panel ${props.exiting ? 'round-modal-panel--out' : ''}`}
        onClick={stopPanelPointerPropagation}
      >
        <button
          type="button"
          className="round-modal-close"
          aria-label="Закрыть"
          onClick={props.onClose}
        >
          ×
        </button>
        <div className="round-modal-body">
          <div id="round-modal-title" className="round-modal-title">
            Раунд {props.round}
          </div>
          <div className="round-modal-source">
            <div className="round-modal-source-label">{sourceHeading}</div>
            <div className="round-modal-source-name">{props.sourceLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
