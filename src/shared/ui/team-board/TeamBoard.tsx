import { inferChaosSourceKind } from '@/entities/game/chaosDraftPool';
import { getClubFlagUrl } from '@/entities/game/clubCountries';
import { formationRowsForDisplay, type FormationId } from '@/entities/game/formations';
import { getCountryFlagUrlRu } from '@/entities/game/topCountries';
import { isChaosMode, isNationalDraftSource } from '@/entities/game/gameMode';
import type { ColorSchemeId, GameMode, TeamState } from '@/entities/game/types';

export interface TeamBoardProps {
  team: TeamState;
  formation: FormationId;
  mode: GameMode;
  disabled: boolean;
  selectedSlotId: string | null;
  onSelectSlot?: (slotId: string) => void;
  /** Подсказка «Лучший состав» (клубы / сборные). */
  bestLineupHint?: {
    remaining: number;
    budget: number;
    usedThisRound: boolean;
    onRequest: () => void;
  } | null;
}

export function TeamBoard(props: TeamBoardProps) {
  const rows = formationRowsForDisplay(props.formation);

  return (
    <div
      className={`team-board-card${props.disabled ? ' team-board-card--dim' : ''}`}
      aria-disabled={props.disabled}
    >
      <div className="team-board-head">
        <div>
          <p className="team-board-name">{props.team.name}</p>
          <p className="team-board-formation">{formationLabel(props.formation)}</p>
        </div>
        {props.bestLineupHint ? (
          <div className="team-board-hint-col">
            <div className="team-board-hint-count">
              Подсказки: {props.bestLineupHint.remaining} / {props.bestLineupHint.budget}
            </div>
            <button
              type="button"
              disabled={
                props.bestLineupHint.remaining <= 0 || props.bestLineupHint.usedThisRound
              }
              onClick={props.bestLineupHint.onRequest}
              className={`team-board-hint-btn${
                props.bestLineupHint.remaining <= 0 || props.bestLineupHint.usedThisRound
                  ? ' team-board-hint-btn--used'
                  : ''
              }`}
              title={
                props.bestLineupHint.remaining <= 0
                  ? 'Подсказки закончились'
                  : props.bestLineupHint.usedThisRound
                    ? 'В этом раунде подсказка уже использована'
                    : undefined
              }
            >
              {props.bestLineupHint.remaining <= 0
                ? 'Нет подсказок'
                : props.bestLineupHint.usedThisRound
                  ? 'Уже в раунде'
                  : 'Лучший состав'}
            </button>
          </div>
        ) : null}
      </div>

      <div className="team-board-pitch" style={{ background: pitchBackground(props.team.colorScheme) }}>
        {rows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="team-board-row"
            style={{
              gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))`,
            }}
          >
            {row.map((cell) => {
              const pick = props.team.picksBySlotId[cell.slotId];
              const isSelected = props.selectedSlotId === cell.slotId;
              const isTaken = Boolean(pick?.playerName);
              const chaosKind =
                isChaosMode(props.mode) ? inferChaosSourceKind(pick?.country) : null;
              const flagUrl = isNationalDraftSource(props.mode, chaosKind)
                ? getCountryFlagUrlRu(pick?.country)
                : getClubFlagUrl(pick?.country);
              const sourceLabel = pick?.country ?? '';

              return (
                <button
                  key={cell.slotId}
                  type="button"
                  disabled={props.disabled || isTaken}
                  onClick={() => props.onSelectSlot?.(cell.slotId)}
                  className={`team-board-slot${isTaken ? ' team-board-slot--taken' : ''}${
                    isSelected ? ' team-board-slot--selected' : ''
                  }${props.disabled ? ' team-board-slot--disabled' : ''}`}
                  title={
                    isTaken
                      ? `${pick?.playerName ?? '—'} (${sourceLabel || '—'})`
                      : 'Выбрать слот'
                  }
                >
                  <div className="team-board-slot-label">{cell.label}</div>
                  <div className="team-board-slot-name">{pick?.playerName ?? '—'}</div>
                  <div className="team-board-slot-meta">
                    {sourceLabel ? <span>{sourceLabel}</span> : null}
                    {flagUrl ? (
                      <img
                        src={flagUrl}
                        alt=""
                        className="team-board-flag"
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function formationLabel(id: FormationId): string {
  return id.replace(/^1-/, '');
}

function pitchBackground(scheme: ColorSchemeId): string {
  const stripe =
    'repeating-linear-gradient(90deg, transparent 0, transparent 56px, rgba(0,0,0,0.06) 56px, rgba(0,0,0,0.06) 112px)';
  switch (scheme) {
    case 'green':
      return `${stripe}, linear-gradient(180deg, rgba(32,120,72,0.42) 0%, rgba(18,72,44,0.28) 100%), radial-gradient(circle at 50% 0%, rgba(255,255,255,0.08), transparent 55%)`;
    case 'red':
      return `${stripe}, linear-gradient(180deg, rgba(168,42,52,0.38) 0%, rgba(90,22,28,0.25) 100%), radial-gradient(circle at 50% 0%, rgba(255,255,255,0.06), transparent 55%)`;
    case 'blue':
      return `${stripe}, linear-gradient(180deg, rgba(42,88,190,0.38) 0%, rgba(22,48,110,0.26) 100%), radial-gradient(circle at 50% 0%, rgba(255,255,255,0.06), transparent 55%)`;
    case 'white':
      return `${stripe}, linear-gradient(180deg, rgba(210,214,220,0.28) 0%, rgba(160,168,178,0.14) 100%), radial-gradient(circle at 50% 0%, rgba(255,255,255,0.12), transparent 60%)`;
    default:
      return `${stripe}, linear-gradient(180deg, rgba(32,120,72,0.42) 0%, rgba(18,72,44,0.28) 100%), radial-gradient(circle at 50% 0%, rgba(255,255,255,0.08), transparent 55%)`;
  }
}
