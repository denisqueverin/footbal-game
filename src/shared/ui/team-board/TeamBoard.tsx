import { inferChaosSourceKind } from '@/entities/game/modes/chaosDraftPool';
import { getClubFlagUrl } from '@/entities/game/data/clubCountries';
import { formationRowsForDisplay, type FormationId } from '@/entities/game/core/formations';
import { getCountryFlagUrlRu } from '@/entities/game/data/topCountries';
import { isChaosMode, isNationalDraftSource } from '@/entities/game/modes/gameMode';
import type { CoachAssignment, ColorSchemeId, CpuDifficulty, GameMode, TeamState } from '@/entities/game/core/types';
import { CpuDifficultyIcon } from '@/shared/ui/cpu-difficulty-icon';
import { schemeAccent } from '@/shared/lib/schemeAccent';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

function coachTacticalTooltip(coach: CoachAssignment): string {
  return [
    `Приоритетная схема: ${coach.priorityFormation}`,
    `Сильные стороны: ${coach.strengthsRu}`,
    `Слабые стороны: ${coach.weaknessesRu}`,
  ].join('\n');
}

export interface TeamBoardProps {
  team: TeamState;
  formation: FormationId;
  mode: GameMode;
  disabled: boolean;
  selectedSlotId: string | null;
  onSelectSlot?: (slotId: string) => void;
  pendingPick?: { slotId: string } | null;
  bestLineupHint?: {
    remaining: number;
    budget: number;
    usedThisRound: boolean;
    onRequest: () => void;
  } | null;
  /** Для команды бота — иконка уровня (начинающий / нормальный / сложный). */
  cpuDifficulty?: CpuDifficulty | null;
}

export function TeamBoard(props: TeamBoardProps) {
  const rows = formationRowsForDisplay(props.formation);

  return (
    <div
      className={cn('team-board-card', props.disabled && 'team-board-card--dim')}
      aria-disabled={props.disabled}
    >
      <div className="team-board-head">
        <div>
          <h2 className="team-board-name">
            <span className="team-board-name-title">{props.team.name}</span>
            {props.cpuDifficulty != null ? (
              <CpuDifficultyIcon difficulty={props.cpuDifficulty} className="team-board-name-diff" />
            ) : null}
          </h2>
          <p className="team-board-formation">{formationLabel(props.formation)}</p>
        </div>
        {props.bestLineupHint ? (
          <div className="team-board-hint-col">
            <button
              type="button"
              disabled={props.bestLineupHint.remaining <= 0 || props.bestLineupHint.usedThisRound}
              onClick={props.bestLineupHint.onRequest}
              className={cn(
                'team-board-hint-btn',
                (props.bestLineupHint.remaining <= 0 || props.bestLineupHint.usedThisRound) &&
                  'team-board-hint-btn--used',
              )}
              title={
                props.bestLineupHint.remaining <= 0
                  ? 'Подсказки закончились'
                  : props.bestLineupHint.usedThisRound
                    ? 'В этом раунде подсказка уже использована'
                    : 'Подсказка по лучшему составу на текущий раунд'
              }
            >
              Лучший состав {props.bestLineupHint.remaining}/{props.bestLineupHint.budget}
            </button>
          </div>
        ) : null}
      </div>

      {props.team.coach ? (
        <div
          className="team-board-coach"
          style={{ borderLeft: `3px solid ${schemeAccent(props.team.colorScheme)}` }}
          title={coachTacticalTooltip(props.team.coach)}
        >
          {getCountryFlagUrlRu(props.team.coach.countryRu) ? (
            <img
              src={getCountryFlagUrlRu(props.team.coach.countryRu)!}
              alt=""
              className="team-board-flag"
              width={28}
              height={18}
            />
          ) : null}
          <div className="team-board-coach-text">
            <span className="team-board-coach-label">Тренер</span>
            <span className="team-board-coach-name">{props.team.coach.name}</span>
            <span className="team-board-coach-stars">{props.team.coach.stars}★</span>
          </div>
        </div>
      ) : null}

      <div
        className="team-board-pitch team-board-pitch--flex"
        style={{ background: pitchBackground(props.team.colorScheme) }}
      >
        <div className="team-board-rows">
          {rows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className="team-board-row"
              style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}
            >
              {row.map((cell) => {
                const pick = props.team.picksBySlotId[cell.slotId];
                const isSelected = props.selectedSlotId === cell.slotId;
                const isTaken = Boolean(pick?.playerName);
                const isPending = props.pendingPick?.slotId === cell.slotId && !isTaken;
                const chaosKind = isChaosMode(props.mode) ? inferChaosSourceKind(pick?.country) : null;
                const flagUrl = isNationalDraftSource(props.mode, chaosKind)
                  ? getCountryFlagUrlRu(pick?.country)
                  : getClubFlagUrl(pick?.country);
                const sourceLabel = pick?.country ?? '';

                return (
                  <button
                    key={cell.slotId}
                    type="button"
                    disabled={props.disabled || isTaken || isPending}
                    onClick={() => props.onSelectSlot?.(cell.slotId)}
                    className={cn(
                      'team-board-slot',
                      isTaken && 'team-board-slot--taken',
                      isSelected && 'team-board-slot--selected',
                      props.disabled && 'team-board-slot--disabled',
                    )}
                    title={
                      isTaken
                        ? `${pick?.playerName ?? '—'} (${sourceLabel || '—'})`
                        : 'Выбрать слот'
                    }
                  >
                    <div className="team-board-slot-label">{cell.label}</div>
                    <div className="team-board-slot-name">
                      {isPending ? (
                        <span className="team-board-pending-wrap">
                          <span className="team-board-spinner" aria-hidden="true" />
                          Думает…
                        </span>
                      ) : (
                        <span className="team-board-name-wrap">
                          <span>{pick?.playerName ?? '—'}</span>
                          {pick?.pickedBy === 'cpu' && pick?.playerStars != null ? (
                            <span className="team-board-stars-pill" title={`Уровень: ${pick.playerStars}★`}>
                              {pick.playerStars}★
                            </span>
                          ) : null}
                        </span>
                      )}
                    </div>
                    <div className="team-board-slot-meta">
                      {sourceLabel ? <span>{sourceLabel}</span> : null}
                      {flagUrl ? (
                        <img src={flagUrl} alt="" className="team-board-flag" width={18} height={12} loading="lazy" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formationLabel(id: FormationId): string {
  return id.replace(/^1-/, '');
}

function pitchBackground(scheme: ColorSchemeId): string {
  switch (scheme) {
    case 'green':
      return 'linear-gradient(180deg, rgba(38,145,80,0.25), rgba(38,145,80,0.10)), radial-gradient(circle at 30% 0%, rgba(255,255,255,0.06), transparent 55%)';
    case 'red':
      return 'linear-gradient(180deg, rgba(190,48,58,0.22), rgba(190,48,58,0.08)), radial-gradient(circle at 30% 0%, rgba(255,255,255,0.06), transparent 55%)';
    case 'blue':
      return 'linear-gradient(180deg, rgba(45,92,200,0.22), rgba(45,92,200,0.08)), radial-gradient(circle at 30% 0%, rgba(255,255,255,0.06), transparent 55%)';
    case 'white':
      return 'linear-gradient(180deg, rgba(245,245,248,0.18), rgba(245,245,248,0.08)), radial-gradient(circle at 30% 0%, rgba(255,255,255,0.08), transparent 60%)';
    default:
      return 'linear-gradient(180deg, rgba(38,145,80,0.25), rgba(38,145,80,0.10)), radial-gradient(circle at 30% 0%, rgba(255,255,255,0.06), transparent 55%)';
  }
}
