import type { CSSProperties } from 'react';

import { inferChaosSourceKind } from '@/entities/game/modes/chaosDraftPool';
import { getClubFlagUrl } from '@/entities/game/data/clubCountries';
import { formationRowsForDisplay, type FormationId } from '@/entities/game/core/formations';
import { getCountryFlagUrlRu } from '@/entities/game/data/topCountries';
import { isChaosMode, isNationalDraftSource } from '@/entities/game/modes/gameMode';
import type { ColorSchemeId, GameMode, TeamState } from '@/entities/game/core/types';

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
          <div style={styles.hintCol}>
            <div style={styles.hintCounter}>
              Подсказки: {props.bestLineupHint.remaining} / {props.bestLineupHint.budget}
            </div>
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

      <div style={{ ...styles.pitch, background: pitchBackground(props.team.colorScheme) }}>
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
    gap: 12,
    padding: 12,
    borderBottom: '1px solid rgba(255,255,255,0.10)',
    background: 'rgba(0,0,0,0.14)',
    flexWrap: 'wrap',
  },
  headerMain: { minWidth: 0, flex: '1 1 auto' },
  teamName: { fontWeight: 800, letterSpacing: -0.2 },
  hintCol: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 },
  hintCounter: { fontSize: 11, fontWeight: 700, opacity: 0.85, whiteSpace: 'nowrap' },
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
  small: { opacity: 0.75, fontSize: 13 },
  pitch: {
    flex: '1 1 auto',
    padding: 12,
    display: 'grid',
    gap: 12,
  },
  row: { display: 'grid', gap: 10 },
  slot: {
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(0,0,0,0.22)',
    padding: 10,
    textAlign: 'center',
    color: 'inherit',
    cursor: 'pointer',
    minHeight: 78,
    display: 'grid',
    alignContent: 'center',
    gap: 3,
  },
  slotDisabled: { cursor: 'not-allowed' },
  slotTaken: { border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(0,0,0,0.32)' },
  slotSelected: { border: '1px solid rgba(128,168,255,0.75)', background: 'rgba(68,120,255,0.18)' },
  slotLabel: { fontSize: 12, opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  slotName: { fontWeight: 750, fontSize: 14, lineHeight: 1.15 },
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
    fontSize: 12,
    opacity: 0.8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexWrap: 'wrap',
    minHeight: 18,
  },
  slotMetaText: { lineHeight: 1.2 },
  flagImg: {
    width: 18,
    height: 12,
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
