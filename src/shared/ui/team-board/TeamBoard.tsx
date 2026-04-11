import type { CSSProperties } from 'react';

import { inferChaosSourceKind } from '@/entities/game/modes/chaosDraftPool';
import { getClubFlagUrl } from '@/entities/game/data/clubCountries';
import { formationRowsForDisplay, type FormationId } from '@/entities/game/core/formations';
import { getCountryFlagUrlRu } from '@/entities/game/data/topCountries';
import { isChaosMode, isNationalDraftSource } from '@/entities/game/modes/gameMode';
import type { CoachAssignment, ColorSchemeId, GameMode, TeamState } from '@/entities/game/core/types';
import { schemeAccent } from '@/shared/lib/schemeAccent';

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
  /** Временный лоадер в слоте (например, когда компьютер "думает"). */
  pendingPick?: { slotId: string } | null;
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
      style={{
        ...styles.card,
        ...(props.disabled ? styles.cardDisabled : null),
      }}
      aria-disabled={props.disabled}
    >
      <div style={styles.header}>
        <div style={styles.headerMain}>
          <div style={styles.teamName}>{props.team.name}</div>
          <div style={styles.small}>{formationLabel(props.formation)}</div>
        </div>
        {props.bestLineupHint ? (
          <div style={styles.hintBtnWrap}>
            <button
              type="button"
              disabled={
                props.bestLineupHint.remaining <= 0 || props.bestLineupHint.usedThisRound
              }
              onClick={props.bestLineupHint.onRequest}
              style={{
                ...styles.hintBtn,
                ...(props.bestLineupHint.remaining <= 0 || props.bestLineupHint.usedThisRound
                  ? styles.hintBtnUsed
                  : null),
              }}
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
          style={{
            ...styles.coachStrip,
            borderLeft: `3px solid ${schemeAccent(props.team.colorScheme)}`,
          }}
          title={coachTacticalTooltip(props.team.coach)}
        >
          {getCountryFlagUrlRu(props.team.coach.countryRu) ? (
            <img
              src={getCountryFlagUrlRu(props.team.coach.countryRu)!}
              alt=""
              style={styles.coachFlag}
              width={28}
              height={18}
            />
          ) : null}
          <div style={styles.coachStripText}>
            <span style={styles.coachStripLabel}>Тренер</span>
            <span style={styles.coachStripName}>{props.team.coach.name}</span>
            <span style={styles.coachStripStars}>{props.team.coach.stars}★</span>
          </div>
        </div>
      ) : null}

      <div style={{ ...styles.pitch, background: pitchBackground(props.team.colorScheme) }}>
        <div style={styles.pitchRows}>
          {rows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              style={{
                ...styles.row,
                gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))`,
              }}
            >
              {row.map((cell) => {
                const pick = props.team.picksBySlotId[cell.slotId];
                const isSelected = props.selectedSlotId === cell.slotId;
                const isTaken = Boolean(pick?.playerName);
                const isPending = props.pendingPick?.slotId === cell.slotId && !isTaken;
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
                    disabled={props.disabled || isTaken || isPending}
                    onClick={() => props.onSelectSlot?.(cell.slotId)}
                    style={{
                      ...styles.slot,
                      ...(isTaken ? styles.slotTaken : null),
                      ...(isSelected ? styles.slotSelected : null),
                      ...(props.disabled ? styles.slotDisabled : null),
                    }}
                    title={
                      isTaken
                        ? `${pick?.playerName ?? '—'} (${sourceLabel || '—'})`
                        : 'Выбрать слот'
                    }
                  >
                    <div style={styles.slotLabel}>{cell.label}</div>
                    <div style={styles.slotName}>
                      {isPending ? (
                        <span style={styles.pendingWrap}>
                          <span style={styles.spinner} aria-hidden="true" />
                          Думает…
                        </span>
                      ) : (
                        <span style={styles.nameWrap}>
                          <span>{pick?.playerName ?? '—'}</span>
                          {pick?.pickedBy === 'cpu' && pick?.playerStars != null ? (
                            <span style={styles.cpuStars} title={`Уровень: ${pick.playerStars}★`}>
                              {pick.playerStars}★
                            </span>
                          ) : null}
                        </span>
                      )}
                    </div>
                    <div style={styles.slotMeta}>
                      {sourceLabel ? <span style={styles.slotMetaText}>{sourceLabel}</span> : null}
                      {flagUrl ? (
                        <img
                          src={flagUrl}
                          alt=""
                          style={styles.flagImg}
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

const styles: Record<string, CSSProperties> = {
  card: {
    flex: '1 1 auto',
    minHeight: 0,
    width: '100%',
    height: '100%',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  cardDisabled: { opacity: 0.92 },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    padding: '8px 10px',
    minHeight: 46,
    boxSizing: 'border-box',
    borderBottom: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(0,0,0,0.14)',
    flexWrap: 'wrap',
  },
  headerMain: { minWidth: 0, flex: '1 1 auto' },
  teamName: { fontWeight: 800, letterSpacing: -0.2 },
  hintBtnWrap: { flexShrink: 0, alignSelf: 'flex-start' },
  hintBtn: {
    flexShrink: 0,
    padding: '7px 10px',
    borderRadius: 10,
    border: '1px solid rgba(212, 175, 55, 0.45)',
    background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.18) 0%, rgba(10, 15, 24, 0.5) 100%)',
    color: '#f2e6b8',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 12,
    whiteSpace: 'nowrap',
  },
  hintBtnUsed: {
    opacity: 0.55,
    cursor: 'not-allowed',
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(0,0,0,0.2)',
    color: 'inherit',
    fontWeight: 650,
  },
  small: { opacity: 0.75, fontSize: 12 },
  coachStrip: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    minHeight: 38,
    boxSizing: 'border-box',
    background: 'rgba(0,0,0,0.2)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    cursor: 'help',
  },
  coachFlag: {
    flexShrink: 0,
    objectFit: 'cover',
    borderRadius: 4,
    border: '1px solid rgba(0,0,0,0.35)',
  },
  coachStripText: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 8,
    minWidth: 0,
  },
  coachStripLabel: { fontSize: 10, fontWeight: 750, opacity: 0.65, textTransform: 'uppercase' },
  coachStripName: { fontWeight: 800, fontSize: 13 },
  coachStripStars: { fontSize: 12, fontWeight: 850, opacity: 0.9 },
  pitch: {
    flex: '1 1 auto',
    minHeight: 0,
    padding: '6px 8px',
    display: 'flex',
    flexDirection: 'column',
  },
  pitchRows: {
    flex: '1 1 auto',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 'clamp(4px, 0.9dvh, 10px)',
  },
  row: {
    display: 'grid',
    gap: 'clamp(4px, 0.8vw, 8px)',
    alignItems: 'stretch',
    minHeight: 0,
  },
  slot: {
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(0,0,0,0.22)',
    padding: 'clamp(4px, 0.9dvh, 9px)',
    textAlign: 'center',
    color: 'inherit',
    cursor: 'pointer',
    minHeight: 'clamp(48px, 6dvh, 82px)',
    alignSelf: 'stretch',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 2,
  },
  slotDisabled: { cursor: 'not-allowed' },
  slotTaken: { border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(0,0,0,0.32)' },
  slotSelected: { border: '1px solid rgba(128,168,255,0.75)', background: 'rgba(68,120,255,0.18)' },
  slotLabel: {
    fontSize: 11,
    opacity: 0.8,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotName: {
    fontWeight: 750,
    fontSize: 'clamp(10px, 0.85vw + 8px, 13px)',
    lineHeight: 1.15,
    flex: '1 1 auto',
    minHeight: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cpuStars: {
    fontSize: 12,
    fontWeight: 850,
    padding: '2px 6px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(0,0,0,0.22)',
    opacity: 0.95,
    whiteSpace: 'nowrap',
  },
  slotMeta: {
    fontSize: 10,
    opacity: 0.8,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flexWrap: 'wrap',
    minHeight: 14,
  },
  slotMetaText: { lineHeight: 1.2 },
  flagImg: {
    width: 16,
    height: 11,
    objectFit: 'cover',
    borderRadius: 2,
    border: '1px solid rgba(0,0,0,0.4)',
    backgroundColor: '#000',
  },
  pendingWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontWeight: 750,
    opacity: 0.95,
  },
  spinner: {
    width: 14,
    height: 14,
    borderRadius: 999,
    border: '2px solid rgba(255,255,255,0.25)',
    borderTopColor: 'rgba(255,255,255,0.9)',
    animation: 'fc-spin 0.8s linear infinite',
    display: 'inline-block',
  },
};
