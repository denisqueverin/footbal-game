import { useEffect } from 'react';

export interface ConfirmNewGameModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmNewGameModal(props: ConfirmNewGameModalProps) {
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
    <div className="round-modal-backdrop confirm-new-game-backdrop" role="presentation" onClick={props.onClose}>
      <div
        className="round-modal-panel confirm-new-game-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-new-game-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="round-modal-close-wrap">
          <button type="button" className="round-modal-close" aria-label="Закрыть" onClick={props.onClose}>
            ×
          </button>
        </div>
        <div className="round-modal-body">
          <p id="confirm-new-game-title" className="confirm-new-game-text">
            Вы точно хотите закончить игру? Текущий прогресс будет потерян
          </p>
          <div className="confirm-new-game-actions">
            <button type="button" className="confirm-new-game-btn confirm-new-game-btn--no" onClick={props.onClose}>
              Нет
            </button>
            <button
              type="button"
              className="confirm-new-game-btn confirm-new-game-btn--yes"
              onClick={() => {
                props.onConfirm();
                props.onClose();
              }}
            >
              Да
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
