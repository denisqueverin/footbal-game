import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { roundTurnOrder } from '@/entities/game/turnOrder';
import type { GameState, TeamId } from '@/entities/game/types';

import { APP_VERSION } from '@/shared/config/version';
import { schemeAccent } from '@/shared/lib/schemeAccent';
import { RoundIntroModal } from '@/shared/ui/round-intro-modal';
import { TeamBoard } from '@/shared/ui/team-board';

import { ROUND_MODAL_EXIT_MS, ROUND_MODAL_MS } from './game-page.constants';

export interface GamePageProps {
  state: GameState;
  onConfirmPick: (team: TeamId, slotId: string, playerName: string) => void;
  onReset: () => void;
}

export function GamePage(props: GamePageProps) {
  const { state } = props;
  const activeTeam = state.turn;

  const [playerName, setPlayerName] = useState('');
  const [slotId, setSlotId] = useState<string | null>(null);
  const [roundModalOpen, setRoundModalOpen] = useState(false);
  const [roundModalExiting, setRoundModalExiting] = useState(false);
  const roundModalTimersRef = useRef<{ exit?: number; hide?: number }>({});

  const clearRoundModalTimers = useCallback(() => {
    const timers = roundModalTimersRef.current;

    if (timers.exit !== undefined) {
      window.clearTimeout(timers.exit);
    }

    if (timers.hide !== undefined) {
      window.clearTimeout(timers.hide);
    }

    roundModalTimersRef.current = {};
  }, []);

  const handleCloseRoundModal = useCallback(() => {
    clearRoundModalTimers();
    setRoundModalExiting(true);
    roundModalTimersRef.current.hide = window.setTimeout(() => {
      setRoundModalOpen(false);
      setRoundModalExiting(false);
      roundModalTimersRef.current = {};
    }, ROUND_MODAL_EXIT_MS);
  }, [clearRoundModalTimers]);

  const activeTeamState = state.teams[activeTeam];
  const activeSlotTaken = slotId ? Boolean(activeTeamState.picksBySlotId[slotId]?.playerName) : false;

  const canConfirm = useMemo(() => {
    return Boolean(state.currentCountry) && Boolean(slotId) && !activeSlotTaken && playerName.trim().length > 0;
  }, [activeSlotTaken, playerName, slotId, state.currentCountry]);

  const roundTurnSequence = useMemo(
    () =>
      state.roundIndex > 0
        ? roundTurnOrder(state.teamOrder, state.draftTurnOrderBase, state.roundIndex)
        : [],
    [state.draftTurnOrderBase, state.roundIndex, state.teamOrder],
  );

  useEffect(() => {
    setSlotId(null);
  }, [activeTeam]);

  useEffect(() => {
    if (state.phase !== 'drafting' || !state.currentCountry) {
      clearRoundModalTimers();
      setRoundModalOpen(false);
      setRoundModalExiting(false);
      return;
    }

    clearRoundModalTimers();
    setRoundModalOpen(true);
    setRoundModalExiting(false);

    roundModalTimersRef.current.exit = window.setTimeout(() => {
      setRoundModalExiting(true);
    }, ROUND_MODAL_MS);

    roundModalTimersRef.current.hide = window.setTimeout(() => {
      setRoundModalOpen(false);
      setRoundModalExiting(false);
      roundModalTimersRef.current = {};
    }, ROUND_MODAL_MS + ROUND_MODAL_EXIT_MS);

    return () => {
      clearRoundModalTimers();
    };
  }, [state.roundIndex, state.currentCountry, state.phase, clearRoundModalTimers]);

  const handleConfirmPick = useCallback(() => {
    if (!slotId) {
      return;
    }

    props.onConfirmPick(activeTeam, slotId, playerName);
    setPlayerName('');
    setSlotId(null);
  }, [activeTeam, playerName, props.onConfirmPick, slotId]);

  const handlePlayerNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerName(event.target.value);
  }, []);

  const handlePlayerNameKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') {
        return;
      }

      if (!canConfirm) {
        return;
      }

      event.preventDefault();
      handleConfirmPick();
    },
    [canConfirm, handleConfirmPick],
  );

  const handleResetClick = useCallback(() => {
    props.onReset();
  }, [props]);

  return (
    <div style={styles.page}>
      <RoundIntroModal
        open={roundModalOpen}
        exiting={roundModalExiting}
        round={state.roundIndex}
        sourceLabel={state.currentCountry ?? ''}
        mode={state.mode}
        onClose={handleCloseRoundModal}
      />
      <div style={styles.topbar}>
        <div>
          <div style={styles.title}>{state.mode === 'clubs' ? 'Текущий клуб' : 'Текущая страна'}</div>
          <div style={styles.country}>
            <b>{state.currentCountry ?? '—'}</b>
          </div>
        </div>

        <div style={styles.topbarRight}>
          <span style={styles.versionTag}>v{APP_VERSION}</span>
          <button type="button" onClick={handleResetClick} style={styles.ghostBtn}>
            Новая игра
          </button>
        </div>
      </div>

      {roundTurnSequence.length > 0 ? (
        <div className="game-turn-order" aria-label="Очерёдность ходов в этом раунде">
          <div className="game-turn-order-label">Раунд {state.roundIndex} — очередность ходов</div>
          <div className="game-turn-order-chips">
            {roundTurnSequence.map((teamId, index) => {
              const team = state.teams[teamId];
              const isActive = state.turn === teamId;

              return (
                <span
                  key={`${state.roundIndex}-${teamId}-${index}`}
                  className={`game-turn-chip${isActive ? ' game-turn-chip--active' : ''}`}
                  style={{ ['--chip-accent' as string]: schemeAccent(team.colorScheme) }}
                >
                  <span className="game-turn-chip-num">{index + 1}</span>
                  {team.name}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}

      <div style={styles.boards}>
        {state.teamOrder.map((teamId) => (
          <div key={teamId} style={styles.side}>
            <TeamBoard
              team={state.teams[teamId]}
              formation={state.teams[teamId].formation}
              mode={state.mode}
              selectedSlotId={activeTeam === teamId ? slotId : null}
              onSelectSlot={activeTeam === teamId ? setSlotId : undefined}
              disabled={activeTeam !== teamId}
            />
            {activeTeam !== teamId ? <div style={styles.overlay} aria-hidden="true" /> : null}
          </div>
        ))}
      </div>

      <div style={styles.bottom}>
        <div style={styles.formRow}>
          <input
            value={playerName}
            onChange={handlePlayerNameChange}
            onKeyDown={handlePlayerNameKeyDown}
            placeholder="Имя футболиста (свободный ввод)"
            style={styles.input}
          />
          <div style={styles.slotPreview}>
            Слот: <b>{slotId ?? 'не выбран'}</b>
          </div>
          <button
            type="button"
            onClick={handleConfirmPick}
            disabled={!canConfirm}
            style={{ ...styles.primaryBtn, ...(!canConfirm ? styles.primaryBtnDisabled : null) }}
          >
            Подтвердить
          </button>
        </div>
        <div style={styles.hint}>
          Выберите свободный слот на активной стороне и введите имя игрока, затем нажмите «Подтвердить».
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    padding: '16px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(10px)',
  },
  title: { fontWeight: 750, letterSpacing: -0.2 },
  country: { opacity: 0.9, marginTop: 4 },
  topbarRight: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'end' },
  ghostBtn: {
    padding: '8px 10px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    opacity: 0.85,
  },
  boards: {
    flex: '1 1 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 14,
    padding: 14,
    alignItems: 'stretch',
  },
  side: { position: 'relative', minHeight: 360 },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 16,
    pointerEvents: 'auto',
  },
  bottom: {
    borderTop: '1px solid rgba(255,255,255,0.12)',
    padding: '14px 18px',
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(10px)',
  },
  formRow: { display: 'flex', gap: 10, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' },
  input: {
    flex: '1 1 320px',
    minWidth: 260,
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(0,0,0,0.24)',
    color: 'inherit',
    outline: 'none',
  },
  slotPreview: { opacity: 0.9 },
  primaryBtn: {
    padding: '10px 14px',
    borderRadius: 12,
    border: '1px solid rgba(128,168,255,0.8)',
    background: 'rgba(68,120,255,0.35)',
    color: 'inherit',
    cursor: 'pointer',
    fontWeight: 650,
  },
  primaryBtnDisabled: { opacity: 0.55, cursor: 'not-allowed' },
  hint: { marginTop: 8, opacity: 0.75, fontSize: 13 },
  versionTag: { fontSize: 12, opacity: 0.55, marginRight: 4 },
};
