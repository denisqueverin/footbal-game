import type { CSSProperties, MouseEvent } from 'react';

import { getClubFlagUrl } from '@/entities/game/data/clubCountries';
import { isChaosMode, isClubsMode, isNationalDraftSource } from '@/entities/game/modes/gameMode';
import { getCountryFlagUrlRu } from '@/entities/game/data/topCountries';
import type { DraftSourceKind, GameMode } from '@/entities/game/core/types';

export interface RoundIntroModalProps {
  round: number;
  sourceLabel: string;
  mode: GameMode;
  /** Режим «Хаос»: тип источника раунда. */
  draftSourceKind?: DraftSourceKind | null;
  open: boolean;
  exiting: boolean;
  /** Длительность до авто-закрытия (мс), совпадает с таймером в GamePage. */
  autoCloseMs: number;
  onClose: () => void;
}

function stopPanelPointerPropagation(event: MouseEvent<HTMLDivElement>): void {
  event.stopPropagation();
}

export function RoundIntroModal(props: RoundIntroModalProps) {
  if (!props.open) {
    return null;
  }

  const chaosKind = isChaosMode(props.mode) ? (props.draftSourceKind ?? null) : null;

  const sourceHeading = isChaosMode(props.mode)
    ? 'Клуб или страна, из которой вы выбираете'
    : isClubsMode(props.mode)
      ? 'Клуб, из которого вы выбираете'
      : 'Страна, из которой вы выбираете';

  const flagUrl = isNationalDraftSource(props.mode, chaosKind)
    ? getCountryFlagUrlRu(props.sourceLabel)
    : getClubFlagUrl(props.sourceLabel);

  const ringR = 17;

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
        <div
          className={`round-modal-close-wrap${props.exiting ? ' round-modal-close-wrap--exiting' : ''}`}
          style={
            {
              ['--round-modal-autoclose-ms' as string]: `${props.autoCloseMs}ms`,
            } as CSSProperties
          }
        >
          <svg
            className="round-modal-close-ring"
            viewBox="0 0 40 40"
            aria-hidden="true"
            focusable="false"
          >
            <circle className="round-modal-close-ring-track" cx="20" cy="20" r={ringR} />
            <circle className="round-modal-close-ring-progress" cx="20" cy="20" r={ringR} pathLength={1} />
          </svg>
          <button type="button" className="round-modal-close" aria-label="Закрыть" onClick={props.onClose}>
            ×
          </button>
        </div>
        <div className="round-modal-body">
          <div id="round-modal-title" className="round-modal-title">
            Раунд {props.round}
          </div>
          <div className="round-modal-source">
            <div className="round-modal-source-label">{sourceHeading}</div>
            <div className="round-modal-source-main">
              <div className="round-modal-source-name">{props.sourceLabel}</div>
              {flagUrl ? (
                <img
                  className="round-modal-flag"
                  src={flagUrl}
                  alt=""
                  width={44}
                  height={30}
                  loading="eager"
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
