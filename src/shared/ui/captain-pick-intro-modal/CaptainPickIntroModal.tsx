import type { CSSProperties, MouseEvent } from 'react';

import { CaptainArmbandIcon } from '@/shared/ui/captain-armband-icon/CaptainArmbandIcon';

export interface CaptainPickIntroModalProps {
  teamLabel: string;
  open: boolean;
  exiting: boolean;
  autoCloseMs: number;
  onClose: () => void;
}

function stopPanelPointerPropagation(event: MouseEvent<HTMLDivElement>): void {
  event.stopPropagation();
}

export function CaptainPickIntroModal(props: CaptainPickIntroModalProps) {
  if (!props.open) {
    return null;
  }

  const ringR = 17;

  return (
    <div
      className={`round-modal-backdrop ${props.exiting ? 'round-modal-backdrop--out' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="captain-intro-modal-title"
    >
      <div
        className={`round-modal-panel ${props.exiting ? 'round-modal-panel--out' : ''}`}
        onClick={stopPanelPointerPropagation}
      >
        <div
          className={`round-modal-close-wrap${props.exiting ? ' round-modal-close-wrap--exiting' : ''}`}
          style={
            {
              ['--round-modal-autoclose-ms' as string]: `${props.autoCloseMs}ms`,
            } as CSSProperties
          }
        >
          <svg className="round-modal-close-ring" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
            <circle className="round-modal-close-ring-track" cx="20" cy="20" r={ringR} />
            <circle className="round-modal-close-ring-progress" cx="20" cy="20" r={ringR} pathLength={1} />
          </svg>
          <button type="button" className="round-modal-close" aria-label="Закрыть" onClick={props.onClose}>
            ×
          </button>
        </div>
        <div className="round-modal-body">
          <div id="captain-intro-modal-title" className="round-modal-title">
            Капитан команды
          </div>
          <div className="round-modal-source">
            <div className="round-modal-source-label">Выберите капитана на поле за команду</div>
            <div className="round-modal-source-main">
              <div className="round-modal-source-name">{props.teamLabel}</div>
              <CaptainArmbandIcon className="round-modal-flag" size={44} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
