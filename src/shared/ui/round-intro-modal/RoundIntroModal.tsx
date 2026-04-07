import type { MouseEvent } from 'react';

import { getClubFlagUrl } from '@/entities/game/clubCountries';
import { isChaosMode, isClubsMode, isNationalDraftSource } from '@/entities/game/gameMode';
import { getCountryFlagUrlRu } from '@/entities/game/topCountries';
import type { DraftSourceKind, GameMode } from '@/entities/game/types';

export interface RoundIntroModalProps {
  round: number;
  sourceLabel: string;
  mode: GameMode;
  /** Режим «Хаос»: тип источника раунда. */
  draftSourceKind?: DraftSourceKind | null;
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

  const chaosKind = isChaosMode(props.mode) ? (props.draftSourceKind ?? null) : null;

  const sourceHeading = isChaosMode(props.mode)
    ? 'Клуб или страна, из которой вы выбираете'
    : isClubsMode(props.mode)
      ? 'Клуб, из которого вы выбираете'
      : 'Страна, из которой вы выбираете';

  const flagUrl = isNationalDraftSource(props.mode, chaosKind)
    ? getCountryFlagUrlRu(props.sourceLabel)
    : getClubFlagUrl(props.sourceLabel);

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
