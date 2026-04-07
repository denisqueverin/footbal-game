import {
  type CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { getClubFlagUrl } from '@/entities/game/clubCountries';
import { roundTurnOrder } from '@/entities/game/turnOrder';
import { getCountryFlagUrlRu } from '@/entities/game/topCountries';
import { isNationalMode } from '@/entities/game/gameMode';
import type { GameState, TeamId } from '@/entities/game/types';

import { APP_VERSION } from '@/shared/config/version';
import { schemeAccent } from '@/shared/lib/schemeAccent';
import { BestLineupModal } from '@/shared/ui/best-lineup-modal';
import { ConfirmNewGameModal } from '@/shared/ui/confirm-new-game-modal';
import { RoundIntroModal } from '@/shared/ui/round-intro-modal';
import { TeamBoard } from '@/shared/ui/team-board';

import { ROUND_MODAL_EXIT_MS, ROUND_MODAL_MS } from './game-page.constants';
import { formatDraftDuration, getDraftElapsedMs } from './game-page.utils';
import { LineupEditor } from './ui/LineupEditor';

export interface GamePageProps {
  state: GameState;
  onConfirmPick: (team: TeamId, slotId: string, playerName: string) => void;
  onReset: () => void;
  onSetDraftTimerPaused: (paused: boolean) => void;
  onSetPickPlayerName: (team: TeamId, slotId: string, playerName: string) => void;
  onUseBestLineupHint: (team: TeamId) => void;
}

export function GamePage(props: GamePageProps) {
  const { state } = props;
  const activeTeam = state.turn;

  const [now, setNow] = useState(() => Date.now());
  const [playerName, setPlayerName] = useState('');
  const [slotId, setSlotId] = useState<string | null>(null);
  const [roundModalOpen, setRoundModalOpen] = useState(false);
  const [roundModalExiting, setRoundModalExiting] = useState(false);
  /** Увеличивается при «Завершить редактирование» — заново показываем интро текущего раунда. */
  const [resumeModalEpoch, setResumeModalEpoch] = useState(0);
  const [bestLineupOpen, setBestLineupOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
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

  const isEditingLineups = state.draftTimerPausedAt != null;

  const draftElapsedMs = useMemo(() => getDraftElapsedMs(state, now), [state, now]);

  const draftTimerLabel = formatDraftDuration(draftElapsedMs);

  const currentSourceFlagUrl = useMemo(() => {
    const label = state.currentCountry;
    if (!label) return null;
    return state.mode === 'clubs' ? getClubFlagUrl(label) : getCountryFlagUrlRu(label);
  }, [state.currentCountry, state.mode]);

  useEffect(() => {
    if (state.phase !== 'drafting' || state.draftTimerPausedAt != null) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [state.phase, state.draftTimerPausedAt]);

  useEffect(() => {
    setSlotId(null);
  }, [activeTeam]);

  /** Сразу убираем интро с экрана при входе в редактирование (до paint — без «вспышки» модалки). */
  useLayoutEffect(() => {
    if (state.draftTimerPausedAt == null) {
      return;
    }
    clearRoundModalTimers();
    setRoundModalOpen(false);
    setRoundModalExiting(false);
  }, [state.draftTimerPausedAt, clearRoundModalTimers]);

  useEffect(() => {
    if (state.draftTimerPausedAt != null) {
      return;
    }

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
  }, [
    state.roundIndex,
    state.currentCountry,
    state.phase,
    state.draftTimerPausedAt,
    clearRoundModalTimers,
  ]);

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
    setResetConfirmOpen(true);
  }, []);

  const handleResetConfirm = useCallback(() => {
    props.onReset();
  }, [props]);

  const handleToggleEditLineups = useCallback(() => {
    if (isEditingLineups) {
      props.onSetDraftTimerPaused(false);
      setResumeModalEpoch((n) => n + 1);
    } else {
      props.onSetDraftTimerPaused(true);
    }
  }, [isEditingLineups, props]);

  const handleLineupPickNameChange = useCallback(
    (team: TeamId, slotId: string, name: string) => {
      props.onSetPickPlayerName(team, slotId, name);
    },
    [props],
  );

  const handleBestLineupRequest = useCallback(
    (team: TeamId) => {
      props.onUseBestLineupHint(team);
      setBestLineupOpen(true);
    },
    [props],
  );

  return (
    <div style={styles.page}>
      <BestLineupModal
        open={bestLineupOpen}
        onClose={() => setBestLineupOpen(false)}
        mode={state.mode}
        currentSource={state.currentCountry}
        includeBench={state.bestLineupIncludeBench}
      />
      <RoundIntroModal
        key={`${state.roundIndex}-${state.currentCountry ?? ''}-${resumeModalEpoch}`}
        open={roundModalOpen}
        exiting={roundModalExiting}
        round={state.roundIndex}
        sourceLabel={state.currentCountry ?? ''}
        mode={state.mode}
        onClose={handleCloseRoundModal}
      />
      <ConfirmNewGameModal
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={handleResetConfirm}
      />
      <div style={styles.topbar}>
        <div style={styles.topbarLeft}>
          <div style={styles.title}>{state.mode === 'clubs' ? 'Текущий клуб' : 'Текущая страна'}</div>
          <div style={styles.countryRow}>
            <div style={styles.country}>
              <b>{state.currentCountry ?? '—'}</b>
            </div>
            {currentSourceFlagUrl ? (
              <img src={currentSourceFlagUrl} alt="" style={styles.topbarFlag} width={36} height={24} />
            ) : null}
          </div>
        </div>

        <div style={styles.topbarCenter} aria-live="polite">
          <div style={styles.timerCaption}>Время игры</div>
          <div style={styles.timerValue}>{draftTimerLabel}</div>
        </div>

        <div style={styles.topbarRight}>
          {!isEditingLineups ? <span style={styles.versionTag}>v{APP_VERSION}</span> : null}
          <button
            type="button"
            onClick={handleToggleEditLineups}
            style={isEditingLineups ? styles.editBtnFinish : styles.ghostBtn}
          >
            {isEditingLineups ? 'Завершить редактирование' : 'Редактировать составы'}
          </button>
          <button type="button" onClick={handleResetClick} style={styles.ghostBtn}>
            Новая игра
          </button>
        </div>
      </div>

      {!isEditingLineups && roundTurnSequence.length > 0 ? (
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

      {isEditingLineups ? (
        <LineupEditor state={state} onPickNameChange={handleLineupPickNameChange} />
      ) : (
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
                bestLineupHint={
                  (state.mode === 'clubs' || isNationalMode(state.mode)) &&
                  state.phase === 'drafting' &&
                  !isEditingLineups &&
                  Boolean(state.currentCountry)
                    ? {
                        remaining: state.hintsRemaining[teamId],
                        budget: state.hintsBudgetPerPlayer,
                        usedThisRound: state.hintUsedThisRound[teamId],
                        onRequest: () => handleBestLineupRequest(teamId),
                      }
                    : null
                }
              />
              {activeTeam !== teamId ? <div style={styles.overlay} aria-hidden="true" /> : null}
            </div>
          ))}
        </div>
      )}

      {isEditingLineups ? (
        <div style={styles.bottomHintOnly}>
          <div style={styles.hint}>
            Редактируйте имена в списке выше и нажмите «Завершить редактирование», чтобы продолжить игру.
          </div>
        </div>
      ) : (
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
              style={{
                ...styles.primaryBtn,
                ...(!canConfirm ? styles.primaryBtnDisabled : null),
              }}
            >
              Подтвердить
            </button>
          </div>
          <div style={styles.hint}>
            Выберите свободный слот на активной стороне и введите имя игрока, затем нажмите «Подтвердить».
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  topbar: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    gap: 12,
    padding: '16px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(10px)',
  },
  topbarLeft: { minWidth: 0 },
  topbarCenter: {
    textAlign: 'center',
    justifySelf: 'center',
  },
  timerCaption: {
    fontSize: 11,
    fontWeight: 750,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    opacity: 0.65,
  },
  timerValue: {
    fontSize: 22,
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
    color: '#b8e0ff',
    textShadow: '0 0 20px rgba(100, 180, 255, 0.25)',
    marginTop: 2,
  },
  title: { fontWeight: 750, letterSpacing: -0.2 },
  countryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    minWidth: 0,
    flexWrap: 'wrap',
  },
  topbarFlag: {
    flexShrink: 0,
    borderRadius: 4,
    border: '1px solid rgba(0,0,0,0.35)',
    objectFit: 'cover',
  },
  country: { opacity: 0.9 },
  topbarRight: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'end',
    justifySelf: 'end',
  },
  ghostBtn: {
    padding: '8px 10px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    opacity: 0.85,
  },
  /** Яркая кнопка выхода из режима редактирования (вход — обычный ghost, как «Новая игра»). */
  editBtnFinish: {
    padding: '9px 14px',
    borderRadius: 12,
    border: '1px solid rgba(120, 220, 160, 0.5)',
    background: 'linear-gradient(180deg, rgba(80, 200, 130, 0.95) 0%, rgba(30, 120, 75, 0.95) 100%)',
    color: '#f4fff8',
    cursor: 'pointer',
    fontWeight: 750,
    boxShadow: '0 2px 14px rgba(60, 200, 120, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
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
  bottomHintOnly: {
    borderTop: '1px solid rgba(255,255,255,0.12)',
    padding: '12px 18px 16px',
    background: 'rgba(255,255,255,0.03)',
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
