import { useEffect } from 'react';

export interface RandomPlayerHintModalProps {
  open: boolean;
  sourceLabel: string;
  position: string;
  onClose: () => void;
}

export function RandomPlayerHintModal(props: RandomPlayerHintModalProps) {
  useEffect(() => {
    if (!props.open) {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [props.open]);

  useEffect(() => {
    if (!props.open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        props.onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [props.open, props.onClose]);

  if (!props.open) {
    return null;
  }

  return (
    <div className="round-modal-backdrop" role="presentation" onClick={props.onClose}>
      <div
        className="round-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="random-player-hint-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="round-modal-close" aria-label="Закрыть" onClick={props.onClose}>
          ×
        </button>
        <div className="round-modal-body">
          <div id="random-player-hint-title" className="round-modal-title">
            Игроков не осталось
          </div>
          <p className="confirm-new-game-text" style={{ marginTop: 0 }}>
            Для позиции <b>{props.position}</b> в <b>{props.sourceLabel}</b> больше нет доступных игроков без
            совпадений.
          </p>
          <div className="confirm-new-game-actions">
            <button type="button" className="confirm-new-game-btn confirm-new-game-btn--yes" onClick={props.onClose}>
              Понятно
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

