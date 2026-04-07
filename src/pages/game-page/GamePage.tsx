import {
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
import {
  isChaosMode,
  isClubsMode,
  isNationalDraftSource,
  supportsBestLineupHint,
} from '@/entities/game/gameMode';
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
    const chaosKind = isChaosMode(state.mode) ? state.currentDraftSourceKind : null;
    return isNationalDraftSource(state.mode, chaosKind)
      ? getCountryFlagUrlRu(label)
      : getClubFlagUrl(label);
  }, [state.currentCountry, state.currentDraftSourceKind, state.mode]);

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

  const sourceHeading = isChaosMode(state.mode)
    ? 'Текущий источник'
    : isClubsMode(state.mode)
      ? 'Текущий клуб'
      : 'Текущая страна';

  return (
    <div className="game-shell">
      <BestLineupModal
        open={bestLineupOpen}
        onClose={() => setBestLineupOpen(false)}
        mode={state.mode}
        currentSource={state.currentCountry}
        currentDraftSourceKind={isChaosMode(state.mode) ? state.currentDraftSourceKind : null}
        includeBench={state.bestLineupIncludeBench}
      />
      <RoundIntroModal
        key={`${state.roundIndex}-${state.currentCountry ?? ''}-${resumeModalEpoch}`}
        open={roundModalOpen}
        exiting={roundModalExiting}
        round={state.roundIndex}
        sourceLabel={state.currentCountry ?? ''}
        mode={state.mode}
        draftSourceKind={isChaosMode(state.mode) ? state.currentDraftSourceKind : null}
        onClose={handleCloseRoundModal}
      />
      <ConfirmNewGameModal
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={handleResetConfirm}
      />
      <div className="game-topbar">
        <div className="game-topbar-left">
          <p className="game-source-label">{sourceHeading}</p>
          <div className="game-source-value">
            <p className="game-source-name">{state.currentCountry ?? '—'}</p>
            {currentSourceFlagUrl ? (
              <img src={currentSourceFlagUrl} alt="" className="game-topbar-flag" width={40} height={27} />
            ) : null}
          </div>
        </div>

        <div className="game-topbar-center" aria-live="polite">
          <p className="game-timer-cap">Время на поле</p>
          <p className="game-timer-val">{draftTimerLabel}</p>
        </div>

        <div className="game-topbar-right">
          {!isEditingLineups ? <span className="game-version-tag">v{APP_VERSION}</span> : null}
          <button
            type="button"
            onClick={handleToggleEditLineups}
            className={isEditingLineups ? 'game-edit-done-btn' : 'game-ghost-btn'}
          >
            {isEditingLineups ? 'Завершить редактирование' : 'Редактировать составы'}
          </button>
          <button type="button" onClick={handleResetClick} className="game-ghost-btn">
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
        <div className="game-boards">
          {state.teamOrder.map((teamId) => (
            <div key={teamId} className="game-side">
              <TeamBoard
                team={state.teams[teamId]}
                formation={state.teams[teamId].formation}
                mode={state.mode}
                selectedSlotId={activeTeam === teamId ? slotId : null}
                onSelectSlot={activeTeam === teamId ? setSlotId : undefined}
                disabled={activeTeam !== teamId}
                bestLineupHint={
                  supportsBestLineupHint(state.mode) &&
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
              {activeTeam !== teamId ? <div className="game-side-overlay" aria-hidden="true" /> : null}
            </div>
          ))}
        </div>
      )}

      {isEditingLineups ? (
        <div className="game-bottom-hint-only">
          <div className="game-hint">
            Редактируйте имена в списке выше и нажмите «Завершить редактирование», чтобы продолжить игру.
          </div>
        </div>
      ) : (
        <div className="game-bottom">
          <div className="game-form-row">
            <input
              value={playerName}
              onChange={handlePlayerNameChange}
              onKeyDown={handlePlayerNameKeyDown}
              placeholder="Имя футболиста (свободный ввод)"
              className="game-input"
            />
            <div className="game-slot-preview">
              Слот: <strong>{slotId ?? 'не выбран'}</strong>
            </div>
            <button
              type="button"
              onClick={handleConfirmPick}
              disabled={!canConfirm}
              className="game-confirm-btn"
            >
              Подтвердить
            </button>
          </div>
          <div className="game-hint">
            Выберите свободный слот на активной стороне, введите имя игрока и нажмите «Подтвердить».
          </div>
        </div>
      )}
    </div>
  );
}
