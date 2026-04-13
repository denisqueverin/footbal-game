import { inferChaosSourceKind } from '@/entities/game/modes/chaosDraftPool';
import { getClubFlagUrl } from '@/entities/game/data/clubCountries';
import { formationRowsForDisplay, type FormationId } from '@/entities/game/core/formations';
import { getCountryFlagUrlRu } from '@/entities/game/data/topCountries';
import { isChaosMode, isNationalDraftSource } from '@/entities/game/modes/gameMode';
import type { CSSProperties } from 'react';

import type { CoachAssignment, ColorSchemeId, CpuDifficulty, GameMode, TeamState } from '@/entities/game/core/types';
import { CpuDifficultyIcon } from '@/shared/ui/cpu-difficulty-icon';
import { schemeAccent, schemeTeamBoardKitVars } from '@/shared/lib/schemeAccent';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

function slotPlayerStarTierClass(stars: 1 | 2 | 3 | 4 | 5 | null | undefined): string {
  if (stars === 5) return 'team-board-slot--tier-gold';
  if (stars === 4) return 'team-board-slot--tier-silver';
  return '';
}

function coachStarTierClass(stars: 2 | 3 | 4 | 5): string {
  if (stars === 5) return 'team-board-coach--tier-gold';
  if (stars === 4) return 'team-board-coach--tier-silver';
  return '';
}

function coachTacticalTooltip(coach: CoachAssignment): string {
  return [
    `Приоритетная схема: ${coach.priorityFormation}`,
    `Сильные стороны: ${coach.strengthsRu}`,
    `Слабые стороны: ${coach.weaknessesRu}`,
  ].join('\n');
}

export interface TeamBoardSlotDraftEditor {
  slotId: string;
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  confirmTitle?: string;
  onRandom?: () => void;
  randomDisabled?: boolean;
  randomTitle?: string;
}

export interface TeamBoardFilledPickEditor {
  slotId: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saveDisabled?: boolean;
}

export interface TeamBoardProps {
  team: TeamState;
  formation: FormationId;
  mode: GameMode;
  disabled: boolean;
  selectedSlotId: string | null;
  onSelectSlot?: (slotId: string) => void;
  /** Ввод имени и кнопки ✓ / ? прямо в выбранном свободном слоте (ход человека). */
  slotDraftEditor?: TeamBoardSlotDraftEditor | null;
  /** Правка имени уже занятого слота (карандаш). */
  filledPickEditor?: TeamBoardFilledPickEditor | null;
  /** Клик по карандашу у игрока с именем. */
  onRequestEditFilledPick?: (slotId: string) => void;
  pendingPick?: { slotId: string } | null;
  bestLineupHint?: {
    remaining: number;
    budget: number;
    usedThisRound: boolean;
    onRequest: () => void;
  } | null;
  /** Для команды бота — иконка уровня (начинающий / нормальный / сложный). */
  cpuDifficulty?: CpuDifficulty | null;
  /** Подпись в шапке (например, с префиксом «Нейро »). Если не задано — `team.name`. */
  teamDisplayName?: string;
  /** Фаза выбора капитана: клик по занятому слоту (только у активной доски, `disabled === false`). */
  captainPickOnSlot?: (slotId: string) => void;
}

export function TeamBoard(props: TeamBoardProps) {
  const rows = formationRowsForDisplay(props.formation);
  const kitVars = schemeTeamBoardKitVars(props.team.colorScheme) as CSSProperties;

  return (
    <div
      className={cn('team-board-card', props.disabled && 'team-board-card--dim')}
      style={kitVars}
      aria-disabled={props.disabled}
    >
      <div className="team-board-head">
        <div>
          <h2 className="team-board-name">
            <span className="team-board-name-title">{props.teamDisplayName ?? props.team.name}</span>
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
          className={cn('team-board-coach', coachStarTierClass(props.team.coach.stars))}
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
                const editor = props.slotDraftEditor;
                const filledEditor = props.filledPickEditor;
                const isEditingFilledName =
                  filledEditor != null && filledEditor.slotId === cell.slotId && isTaken;

                const isDraftEditing =
                  !props.disabled &&
                  editor != null &&
                  editor.slotId === cell.slotId &&
                  !isTaken &&
                  !isPending;

                const starTier = isTaken ? slotPlayerStarTierClass(pick?.playerStars) : '';

                const captainPick = props.captainPickOnSlot;
                if (captainPick) {
                  if (isTaken && pick?.playerName) {
                    return (
                      <button
                        key={cell.slotId}
                        type="button"
                        className={cn(
                          'team-board-slot',
                          'team-board-slot--taken',
                          'team-board-slot--captain-pick',
                          starTier,
                        )}
                        onClick={() => captainPick(cell.slotId)}
                        title="Назначить капитаном"
                        aria-label={`Капитан: ${pick.playerName}, позиция ${cell.label}`}
                      >
                        <div className="team-board-slot-label">{cell.label}</div>
                        <div className="team-board-slot-name">
                          <span className="team-board-name-wrap">
                            <span>{pick.playerName}</span>
                          </span>
                        </div>
                        <div className="team-board-slot-meta">
                          {sourceLabel ? <span>{sourceLabel}</span> : null}
                          {flagUrl ? (
                            <img src={flagUrl} alt="" className="team-board-flag" width={18} height={12} loading="lazy" />
                          ) : null}
                        </div>
                      </button>
                    );
                  }
                  return (
                    <div
                      key={cell.slotId}
                      className={cn(
                        'team-board-slot',
                        'team-board-slot--disabled',
                        'team-board-slot--captain-pick-empty',
                      )}
                      aria-hidden
                    >
                      <div className="team-board-slot-label">{cell.label}</div>
                      <div className="team-board-slot-name">
                        <span className="team-board-name-wrap">
                          <span>{pick?.playerName ?? '—'}</span>
                        </span>
                      </div>
                      <div className="team-board-slot-meta">
                        {sourceLabel ? <span>{sourceLabel}</span> : null}
                        {flagUrl ? (
                          <img src={flagUrl} alt="" className="team-board-flag" width={18} height={12} loading="lazy" />
                        ) : null}
                      </div>
                    </div>
                  );
                }

                if (isEditingFilledName) {
                  return (
                    <div
                      key={cell.slotId}
                      className={cn(
                        'team-board-slot',
                        'team-board-slot--taken',
                        'team-board-slot--editing',
                        'team-board-slot--edit-filled',
                        isSelected && 'team-board-slot--selected',
                        starTier,
                      )}
                      role="group"
                      aria-label={`Позиция ${cell.label}: правка имени`}
                    >
                      <div className="team-board-slot-label">{cell.label}</div>
                      <input
                        type="text"
                        className="team-board-slot-draft-input"
                        value={filledEditor.value}
                        onChange={(e) => filledEditor.onChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !filledEditor.saveDisabled) {
                            e.preventDefault();
                            filledEditor.onSave();
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            filledEditor.onCancel();
                          }
                        }}
                        placeholder="Имя игрока"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        autoFocus
                      />
                      <div className="team-board-slot-draft-actions">
                        <button
                          type="button"
                          className="team-board-slot-icon-btn team-board-slot-icon-btn--confirm"
                          onClick={filledEditor.onSave}
                          disabled={filledEditor.saveDisabled}
                          title="Сохранить имя"
                          aria-label="Сохранить"
                        >
                          <span aria-hidden="true">✓</span>
                        </button>
                        <button
                          type="button"
                          className="team-board-slot-icon-btn team-board-slot-icon-btn--cancel"
                          onClick={filledEditor.onCancel}
                          title="Отмена"
                          aria-label="Отменить правку"
                        >
                          <span aria-hidden="true">✕</span>
                        </button>
                      </div>
                      <div className="team-board-slot-meta team-board-slot-meta--draft">
                        {sourceLabel ? <span>{sourceLabel}</span> : null}
                        {flagUrl ? (
                          <img src={flagUrl} alt="" className="team-board-flag" width={18} height={12} loading="lazy" />
                        ) : null}
                      </div>
                    </div>
                  );
                }

                if (isDraftEditing) {
                  return (
                    <div
                      key={cell.slotId}
                      className={cn(
                        'team-board-slot',
                        'team-board-slot--editing',
                        isSelected && 'team-board-slot--selected',
                      )}
                      role="group"
                      aria-label={`Позиция ${cell.label}: ввод имени игрока`}
                    >
                      <div className="team-board-slot-label">{cell.label}</div>
                      <input
                        type="text"
                        className="team-board-slot-draft-input"
                        value={editor.value}
                        onChange={(e) => editor.onChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !editor.confirmDisabled) {
                            e.preventDefault();
                            editor.onConfirm();
                          }
                        }}
                        placeholder="Имя игрока"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        autoFocus
                      />
                      <div className="team-board-slot-draft-actions">
                        <button
                          type="button"
                          className="team-board-slot-icon-btn team-board-slot-icon-btn--confirm"
                          onClick={editor.onConfirm}
                          disabled={editor.confirmDisabled}
                          title={editor.confirmTitle ?? 'Подтвердить выбор'}
                          aria-label="Готово"
                        >
                          <span aria-hidden="true">✓</span>
                        </button>
                        {editor.onRandom ? (
                          <button
                            type="button"
                            className="team-board-slot-icon-btn team-board-slot-icon-btn--random"
                            onClick={editor.onRandom}
                            disabled={editor.randomDisabled}
                            title={editor.randomTitle}
                            aria-label="Случайный игрок"
                          >
                            <span aria-hidden="true">?</span>
                          </button>
                        ) : null}
                      </div>
                      <div className="team-board-slot-meta team-board-slot-meta--draft">
                        {sourceLabel ? <span>{sourceLabel}</span> : null}
                        {flagUrl ? (
                          <img src={flagUrl} alt="" className="team-board-flag" width={18} height={12} loading="lazy" />
                        ) : null}
                      </div>
                    </div>
                  );
                }

                if (isTaken && pick?.playerName && props.onRequestEditFilledPick) {
                  return (
                    <div
                      key={cell.slotId}
                      className={cn(
                        'team-board-slot',
                        'team-board-slot--taken',
                        'team-board-slot--taken-static',
                        isSelected && 'team-board-slot--selected',
                        props.disabled && 'team-board-slot--disabled',
                        starTier,
                      )}
                      title={`${pick.playerName} (${sourceLabel || '—'})`}
                    >
                      <div className="team-board-slot-label">{cell.label}</div>
                      <div className="team-board-slot-name">
                        <span className="team-board-name-wrap">
                          <span>{pick.playerName}</span>
                        </span>
                      </div>
                      <div className="team-board-slot-meta">
                        {sourceLabel ? <span>{sourceLabel}</span> : null}
                        {flagUrl ? (
                          <img src={flagUrl} alt="" className="team-board-flag" width={18} height={12} loading="lazy" />
                        ) : null}
                      </div>
                      <div className="team-board-slot-pencil-row">
                        <button
                          type="button"
                          className="team-board-slot-pencil-btn"
                          onClick={() => props.onRequestEditFilledPick?.(cell.slotId)}
                          title="Изменить имя игрока"
                          aria-label={`Изменить имя: ${pick.playerName}`}
                        >
                          <svg
                            className="team-board-pencil-icon"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            aria-hidden
                          >
                            <path
                              fill="currentColor"
                              d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                }

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
                      starTier,
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
    case 'kitRedWhite':
      return 'linear-gradient(180deg, rgba(200,16,46,0.22), rgba(244,244,244,0.08)), radial-gradient(circle at 30% 0%, rgba(255,255,255,0.06), transparent 55%)';
    case 'kitBlueWhite':
      return 'linear-gradient(180deg, rgba(30,77,139,0.24), rgba(244,244,244,0.08)), radial-gradient(circle at 30% 0%, rgba(255,255,255,0.06), transparent 55%)';
    case 'kitMilan':
      return 'linear-gradient(180deg, rgba(200,16,46,0.2), rgba(10,10,12,0.18)), radial-gradient(circle at 30% 0%, rgba(255,255,255,0.05), transparent 55%)';
    case 'kitJuventus':
      return 'linear-gradient(180deg, rgba(36,36,40,0.22), rgba(244,244,248,0.1)), radial-gradient(circle at 30% 0%, rgba(255,255,255,0.06), transparent 55%)';
    case 'kitBarcelona':
      return 'linear-gradient(180deg, rgba(0,77,152,0.22), rgba(165,0,68,0.12)), radial-gradient(circle at 30% 0%, rgba(255,255,255,0.06), transparent 55%)';
    case 'kitRealMadrid':
      return 'linear-gradient(180deg, rgba(248,248,252,0.2), rgba(212,167,58,0.14)), radial-gradient(circle at 30% 0%, rgba(255,255,255,0.08), transparent 55%)';
    case 'kitLiverpool':
      return 'linear-gradient(180deg, rgba(200,16,46,0.26), rgba(40,6,12,0.12)), radial-gradient(circle at 30% 0%, rgba(255,255,255,0.05), transparent 55%)';
    case 'kitBrazil':
      return 'linear-gradient(180deg, rgba(247,208,32,0.24), rgba(0,60,140,0.16)), radial-gradient(circle at 30% 0%, rgba(255,255,255,0.06), transparent 55%)';
    case 'kitNetherlands':
      return 'linear-gradient(180deg, rgba(255,107,10,0.26), rgba(80,30,0,0.1)), radial-gradient(circle at 30% 0%, rgba(255,255,255,0.05), transparent 55%)';
    case 'kitPSG':
      return 'linear-gradient(180deg, rgba(12,26,92,0.28), rgba(180,20,40,0.1)), radial-gradient(circle at 30% 0%, rgba(255,255,255,0.05), transparent 55%)';
    case 'kitArsenalCherry':
      return 'linear-gradient(180deg, rgba(110,22,42,0.28), rgba(244,244,248,0.08)), radial-gradient(circle at 30% 0%, rgba(255,255,255,0.05), transparent 55%)';
    case 'kitLokomotiv':
      return 'linear-gradient(180deg, rgba(210,16,22,0.24), rgba(10,80,50,0.18)), radial-gradient(circle at 30% 0%, rgba(255,255,255,0.05), transparent 55%)';
    case 'kitSynthwave':
      return 'linear-gradient(180deg, rgba(124,58,237,0.26), rgba(34,211,238,0.12)), radial-gradient(circle at 70% 0%, rgba(236,72,153,0.12), transparent 50%)';
    case 'kitAcidTech':
      return 'linear-gradient(180deg, rgba(18,18,20,0.32), rgba(200,255,46,0.14)), radial-gradient(circle at 30% 0%, rgba(200,255,80,0.08), transparent 55%)';
    default:
      return 'linear-gradient(180deg, rgba(38,145,80,0.25), rgba(38,145,80,0.10)), radial-gradient(circle at 30% 0%, rgba(255,255,255,0.06), transparent 55%)';
  }
}
