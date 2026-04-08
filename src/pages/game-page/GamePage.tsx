import {
  type CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useMediaQuery } from '@/shared/lib/useMediaQuery';

import { getClubFlagUrl } from '@/entities/game/data/clubCountries';
import { roundTurnOrder } from '@/entities/game/core/turnOrder';
import { getCountryFlagUrlRu } from '@/entities/game/data/topCountries';
import {
  isChaosMode,
  isClubsMode,
  isNationalDraftSource,
  supportsBestLineupHint,
} from '@/entities/game/modes/gameMode';
import type { DraftSourceKind, GameMode, GameState, TeamId } from '@/entities/game/core/types';
import {
  existingNameKeys,
  countAvailableEuroClubPlayers,
  countAvailableRplPlayers,
  countAvailableTop15Players,
  countAvailableTop30Players,
  pickBestAnyEuroClubOutfieldPlayer,
  pickBestAnyRplOutfieldPlayer,
  pickBestAnyTop15OutfieldPlayer,
  pickBestAnyTop30OutfieldPlayer,
  pickBestEuroClubPlayer,
  pickBestRplPlayer,
  pickBestTop15Player,
  pickBestTop30Player,
  pickRandomAnyEuroClubOutfieldPlayer,
  pickRandomAnyRplOutfieldPlayer,
  pickRandomAnyTop15OutfieldPlayer,
  pickRandomAnyTop30OutfieldPlayer,
  pickRandomEuroClubPlayer,
  pickRandomRplPlayer,
  pickRandomTop15Player,
  pickRandomTop30Player,
} from '@/entities/game/hints/randomPlayerHint';

import { APP_VERSION } from '@/shared/config/version';
import { schemeAccent } from '@/shared/lib/schemeAccent';
import { BestLineupModal } from '@/shared/ui/best-lineup-modal';
import { ConfirmNewGameModal } from '@/shared/ui/confirm-new-game-modal';
import { RandomPlayerHintModal } from '@/shared/ui/random-player-hint-modal/RandomPlayerHintModal';
import { RoundIntroModal } from '@/shared/ui/round-intro-modal';
import { TeamBoard } from '@/shared/ui/team-board';

import { ROUND_MODAL_EXIT_MS, ROUND_MODAL_MS } from './game-page.constants';
import { formatDraftDuration, getDraftElapsedMs } from './game-page.utils';
import { LineupEditor } from './ui/LineupEditor';

export interface GamePageProps {
  state: GameState;
  onConfirmPick: (
    team: TeamId,
    slotId: string,
    playerName: string,
    playerStars?: 1 | 2 | 3 | 4 | 5 | null,
    pickedBy?: 'human' | 'cpu' | null,
  ) => void;
  onReset: () => void;
  onSetDraftTimerPaused: (paused: boolean) => void;
  onSetPickPlayerName: (team: TeamId, slotId: string, playerName: string) => void;
  onUseBestLineupHint: (team: TeamId) => void;
  onUseRandomPlayerHint: (team: TeamId, slotId: string) => void;
  onClearRandomPlayerHintError: () => void;
}

export function GamePage(props: GamePageProps) {
  const { state } = props;
  const isNarrow = useMediaQuery('(max-width: 640px)');
  const styles = useMemo(() => getGamePageStyles(isNarrow), [isNarrow]);
  const activeTeam = state.turn;
  const cpuTurnLockRef = useRef<string | null>(null);

  const [now, setNow] = useState(() => Date.now());
  const [playerName, setPlayerName] = useState('');
  const [slotId, setSlotId] = useState<string | null>(null);
  const [cpuPending, setCpuPending] = useState<null | { slotId: string; pickedName: string; pickedStars: 1 | 2 | 3 | 4 | 5 | null }>(
    null,
  );
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

  const randomHintRemaining = state.randomPlayerHintsRemaining[activeTeam] ?? 0;
  const canUseRandomHint =
    !isEditingLineups &&
    state.phase === 'drafting' &&
    state.randomPlayerHintsBudgetPerPlayer > 0 &&
    (state.mode === 'nationalTop15' ||
      state.mode === 'nationalTop30' ||
      state.mode === 'rpl' ||
      state.mode === 'clubs' ||
      state.mode === 'chaos') &&
    Boolean(state.currentCountry) &&
    Boolean(slotId) &&
    !activeSlotTaken &&
    randomHintRemaining > 0;

  const handleUseRandomHint = useCallback(() => {
    if (!slotId) return;
    props.onUseRandomPlayerHint(activeTeam, slotId);
  }, [activeTeam, props, slotId]);

  // Ход компьютера: выбираем слот -> 3с лоадер -> подсветка -> подтверждение -> передача хода.
  useEffect(() => {
    const cpuTeamId: TeamId = 'team2';
    const isEditingLineups = state.draftTimerPausedAt != null;
    const isCpuTurn =
      state.phase === 'drafting' &&
      state.gameKind === 'vsCpu' &&
      !isEditingLineups &&
      state.turn === cpuTeamId &&
      Boolean(state.currentCountry);

    if (!isCpuTurn) return;

    const lockKey = `${state.roundIndex}:${state.currentCountry ?? ''}:${state.turn}:${Object.values(
      state.teams[cpuTeamId].picksBySlotId,
    )
      .filter((p) => p.playerName)
      .map((p) => p.slotId)
      .join(',')}`;
    if (cpuTurnLockRef.current === lockKey) return;
    cpuTurnLockRef.current = lockKey;

    const source = state.currentCountry;
    if (!source) return;

    const team = state.teams[cpuTeamId];
    const emptySlots = Object.values(team.picksBySlotId).filter((p) => !p.playerName);
    if (emptySlots.length === 0) return;

    const usedKeys = existingNameKeys(state);

    const chaosKind: DraftSourceKind | null =
      state.mode === 'chaos' ? (state.currentDraftSourceKind ?? null) : null;
    const effectiveMode: GameMode =
      state.mode === 'chaos'
        ? chaosKind === 'rplClub'
          ? 'rpl'
          : chaosKind === 'club'
            ? 'clubs'
            : 'nationalTop30'
        : state.mode;

    const pickByPosition = (
      position: string,
      minStars: 1 | 2 | 3 | 4 | 5 | null,
    ): { name: string; stars: 1 | 2 | 3 | 4 | 5 } | null => {
      const picked =
        effectiveMode === 'nationalTop15'
          ? pickRandomTop15Player({ country: source, position, usedNameKeys: usedKeys })
          : effectiveMode === 'nationalTop30'
            ? pickRandomTop30Player({ country: source, position, usedNameKeys: usedKeys })
            : effectiveMode === 'rpl'
              ? pickRandomRplPlayer({ club: source, position, usedNameKeys: usedKeys })
              : pickRandomEuroClubPlayer({ club: source, position, usedNameKeys: usedKeys });
      if (!picked) return null;
      if (minStars != null && picked.stars < minStars) return null;
      return { name: picked.playerName, stars: picked.stars };
    };

    const difficulty = state.cpuDifficulty;

    const pickRandomAny = (): { name: string; stars: 1 | 2 | 3 | 4 | 5 } | null => {
      const any =
        effectiveMode === 'nationalTop15'
          ? pickRandomAnyTop15OutfieldPlayer({ country: source, usedNameKeys: usedKeys })
          : effectiveMode === 'nationalTop30'
            ? pickRandomAnyTop30OutfieldPlayer({ country: source, usedNameKeys: usedKeys })
            : effectiveMode === 'rpl'
              ? pickRandomAnyRplOutfieldPlayer({ club: source, usedNameKeys: usedKeys })
              : pickRandomAnyEuroClubOutfieldPlayer({ club: source, usedNameKeys: usedKeys });
      return any ? { name: any.playerName, stars: any.stars } : null;
    };

    const pickBestByPosition = (
      position: string,
      usedNameKeys: Set<string>,
    ): { name: string; stars: 1 | 2 | 3 | 4 | 5 } | null => {
      const picked =
        effectiveMode === 'nationalTop15'
          ? pickBestTop15Player({ country: source, position, usedNameKeys })
          : effectiveMode === 'nationalTop30'
            ? pickBestTop30Player({ country: source, position, usedNameKeys })
            : effectiveMode === 'rpl'
              ? pickBestRplPlayer({ club: source, position, usedNameKeys })
              : pickBestEuroClubPlayer({ club: source, position, usedNameKeys });
      return picked ? { name: picked.playerName, stars: picked.stars } : null;
    };

    const countByPosition = (position: string, usedNameKeys: Set<string>): number => {
      return effectiveMode === 'nationalTop15'
        ? countAvailableTop15Players({ country: source, position, usedNameKeys })
        : effectiveMode === 'nationalTop30'
          ? countAvailableTop30Players({ country: source, position, usedNameKeys })
          : effectiveMode === 'rpl'
            ? countAvailableRplPlayers({ club: source, position, usedNameKeys })
            : countAvailableEuroClubPlayers({ club: source, position, usedNameKeys });
    };

    const pickBestAnyOutfield = (
      usedNameKeys: Set<string>,
    ): { name: string; stars: 1 | 2 | 3 | 4 | 5 } | null => {
      const picked =
        effectiveMode === 'nationalTop15'
          ? pickBestAnyTop15OutfieldPlayer({ country: source, usedNameKeys })
          : effectiveMode === 'nationalTop30'
            ? pickBestAnyTop30OutfieldPlayer({ country: source, usedNameKeys })
            : effectiveMode === 'rpl'
              ? pickBestAnyRplOutfieldPlayer({ club: source, usedNameKeys })
              : pickBestAnyEuroClubOutfieldPlayer({ club: source, usedNameKeys });
      return picked ? { name: picked.playerName, stars: picked.stars } : null;
    };

    const positionAliases = (label: string): string[] => {
      switch (label) {
        case 'RAM':
          return ['RM', 'RW', 'CAM', 'CM'];
        case 'LAM':
          return ['LM', 'LW', 'CAM', 'CM'];
        case 'RWB':
          return ['RB', 'RM'];
        case 'LWB':
          return ['LB', 'LM'];
        default:
          return [label];
      }
    };

    let picked: { name: string; stars: 1 | 2 | 3 | 4 | 5 } | null = null;
    let chosen = emptySlots[Math.floor(Math.random() * emptySlots.length)]!;

    if (difficulty === 'beginner') {
      // Всегда рандом: может быть непрофильный игрок в непрофильной позиции.
      const slotIsGk = chosen.label === 'GK';
      picked = slotIsGk ? pickByPosition('GK', null) : pickRandomAny();
    } else if (difficulty === 'hard') {
      // Усиленный hard:
      // 1) для каждого свободного слота ищем лучший профильный вариант по звёздам
      // 2) при равенстве звёзд выбираем позицию с меньшим числом доступных кандидатов (дефицитность)
      // 3) если профильных нет — берём strongest outfield
      const moves = emptySlots
        .map((slot) => {
          const aliases = positionAliases(slot.label);
          const variants = aliases
            .map((pos) => {
              const best = pickBestByPosition(pos, usedKeys);
              if (!best) return null;
              const count = countByPosition(pos, usedKeys);
              return { pos, best, count };
            })
            .filter((v) => v != null);
          if (variants.length === 0) return null;

          // берём лучший вариант для слота: max stars, при равенстве — min count (дефицит)
          variants.sort((a, b) => {
            if (a!.best.stars !== b!.best.stars) return b!.best.stars - a!.best.stars;
            return a!.count - b!.count;
          });
          const topStars = variants[0]!.best.stars;
          const top = variants.filter((v) => v!.best.stars === topStars);
          const topMinCount = Math.min(...top.map((v) => v!.count));
          const finalists = top.filter((v) => v!.count === topMinCount);
          const chosenVariant = finalists[Math.floor(Math.random() * finalists.length)]!;

          return { slot, pick: chosenVariant.best, scarcity: chosenVariant.count };
        })
        .filter((x) => x != null);

      if (moves.length > 0) {
        // выбираем лучший ход среди слотов: max stars, при равенстве — min scarcity
        moves.sort((a, b) => {
          if (a!.pick.stars !== b!.pick.stars) return b!.pick.stars - a!.pick.stars;
          return a!.scarcity - b!.scarcity;
        });
        const bestStars = moves[0]!.pick.stars;
        const bestByStars = moves.filter((m) => m!.pick.stars === bestStars);
        const minScarcity = Math.min(...bestByStars.map((m) => m!.scarcity));
        const finalists = bestByStars.filter((m) => m!.scarcity === minScarcity);
        const chosenMove = finalists[Math.floor(Math.random() * finalists.length)]!;
        chosen = chosenMove.slot;
        picked = chosenMove.pick;
      } else {
        // Fallback: если профильного нет ни на один свободный слот — берём самого сильного полевого игрока.
        const outfieldSlots = emptySlots.filter((s) => s.label !== 'GK');
        const bestOutfield = pickBestAnyOutfield(usedKeys);
        if (bestOutfield && outfieldSlots.length > 0) {
          chosen = outfieldSlots[Math.floor(Math.random() * outfieldSlots.length)]!;
          picked = bestOutfield;
        } else {
          // Если остался только GK (или нет полевого игрока) — пытаемся подобрать GK.
          const gkSlot = emptySlots.find((s) => s.label === 'GK');
          const bestGk = pickBestByPosition('GK', usedKeys);
          if (gkSlot && bestGk) {
            chosen = gkSlot;
            picked = bestGk;
          } else {
            picked = pickRandomAny();
          }
        }
      }
    } else {
      const slotIsGk = chosen.label === 'GK';
      // normal: стараемся 4★+, иначе любое на позицию (3★ и ниже).
      picked = pickByPosition(chosen.label, 4) ?? pickByPosition(chosen.label, null);
      if (!picked) {
        picked = slotIsGk ? pickByPosition('GK', null) : pickRandomAny();
      }
    }

    // Последний шанс: если из-за usedNameKeys не нашли никого, разрешаем дубль, но берём реального игрока.
    if (!picked) {
      const noFilter = new Set<string>();
      const outfieldSlots = emptySlots.filter((s) => s.label !== 'GK');
      const bestOutfieldNoFilter = pickBestAnyOutfield(noFilter);
      if (bestOutfieldNoFilter && outfieldSlots.length > 0) {
        chosen = outfieldSlots[Math.floor(Math.random() * outfieldSlots.length)]!;
        picked = bestOutfieldNoFilter;
      } else {
        const gkSlot = emptySlots.find((s) => s.label === 'GK');
        const bestGkNoFilter = pickBestByPosition('GK', noFilter);
        if (gkSlot && bestGkNoFilter) {
          chosen = gkSlot;
          picked = bestGkNoFilter;
        }
      }
    }

    const pickedName = picked?.name ?? `CPU Player ${Math.floor(Math.random() * 10_000)}`;
    const pickedStars = picked?.stars ?? null;

    // 1) Показать лоадер в выбранном слоте.
    setCpuPending({ slotId: chosen.slotId, pickedName, pickedStars });

    // 2) Через 3 секунды — подсветить слот.
    const t1 = window.setTimeout(() => {
      setCpuPending(null);
      setSlotId(chosen.slotId);

      // 3) Небольшая пауза, чтобы подсветка была заметна, затем подтвердить выбор и передать ход.
      const t2 = window.setTimeout(() => {
        props.onConfirmPick(cpuTeamId, chosen.slotId, pickedName, pickedStars, 'cpu');
      }, 250);

      return () => window.clearTimeout(t2);
    }, 3000);

    return () => window.clearTimeout(t1);
  }, [props, state]);

  return (
    <div style={styles.page}>
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
      <RandomPlayerHintModal
        open={state.randomPlayerHintError != null}
        sourceLabel={state.randomPlayerHintError?.sourceLabel ?? ''}
        position={state.randomPlayerHintError?.position ?? ''}
        onClose={props.onClearRandomPlayerHintError}
      />
      <div style={styles.topbar}>
        <div style={styles.topbarLeft}>
          <div style={styles.title}>
            {isChaosMode(state.mode)
              ? 'Текущий источник'
              : isClubsMode(state.mode)
                ? 'Текущий клуб'
                : 'Текущая страна'}
          </div>
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
        <>
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
              {state.mode === 'nationalTop15' ||
              state.mode === 'nationalTop30' ||
              state.mode === 'rpl' ||
              state.mode === 'clubs' ||
              state.mode === 'chaos' ? (
                <button
                  type="button"
                  onClick={handleUseRandomHint}
                  disabled={!canUseRandomHint}
                  style={{
                    ...styles.randomHintBtn,
                    ...(!canUseRandomHint ? styles.randomHintBtnDisabled : null),
                  }}
                  title={
                    canUseRandomHint
                      ? 'Поставить случайного игрока этой позиции из текущей сборной'
                      : randomHintRemaining <= 0
                        ? 'Подсказки «Случайный игрок» закончились'
                        : !slotId
                          ? 'Сначала выберите слот'
                          : activeSlotTaken
                            ? 'Слот уже занят'
                            : !state.currentCountry
                              ? 'Нет текущей сборной для раунда'
                              : undefined
                  }
                >
                  Случайный игрок ({randomHintRemaining})
                </button>
              ) : null}
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
              Выберите свободный слот на поле ниже и введите имя игрока, затем нажмите «Подтвердить».
            </div>
          </div>
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
                  pendingPick={
                    state.gameKind === 'vsCpu' &&
                    state.turn === 'team2' &&
                    teamId === 'team2' &&
                    cpuPending != null
                      ? { slotId: cpuPending.slotId }
                      : null
                  }
                  bestLineupHint={
                    supportsBestLineupHint(state.mode) &&
                    state.hintsBudgetPerPlayer > 0 &&
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
        </>
      )}

      {isEditingLineups ? (
        <div style={styles.bottomHintOnly}>
          <div style={styles.hint}>
            Редактируйте имена в списке выше и нажмите «Завершить редактирование», чтобы продолжить игру.
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getGamePageStyles(isNarrow: boolean): Record<string, CSSProperties> {
  return {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  topbar: {
    display: 'grid',
    gridTemplateColumns: isNarrow ? '1fr' : '1fr auto 1fr',
    alignItems: 'center',
    gap: isNarrow ? 14 : 12,
    padding: isNarrow ? 'max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) 12px max(12px, env(safe-area-inset-left))' : '16px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(10px)',
    textAlign: isNarrow ? 'center' : undefined,
  },
  topbarLeft: isNarrow ? { minWidth: 0, justifySelf: 'center' } : { minWidth: 0 },
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
    gap: isNarrow ? 8 : 12,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: isNarrow ? 'center' : 'end',
    justifySelf: isNarrow ? 'center' : 'end',
    width: isNarrow ? '100%' : undefined,
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
    gridTemplateColumns: isNarrow
      ? '1fr'
      : 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
    gap: isNarrow ? 12 : 14,
    padding: isNarrow
      ? '10px max(10px, env(safe-area-inset-right)) max(14px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left))'
      : '14px 14px max(14px, env(safe-area-inset-bottom)) 14px',
    alignItems: 'stretch',
  },
  side: { position: 'relative', minHeight: isNarrow ? 280 : 360 },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 16,
    pointerEvents: 'auto',
  },
  bottom: {
    borderBottom: '1px solid rgba(255,255,255,0.12)',
    padding: isNarrow
      ? '12px max(12px, env(safe-area-inset-right)) 12px max(12px, env(safe-area-inset-left))'
      : '14px 18px',
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(10px)',
    flexShrink: 0,
  },
  bottomHintOnly: {
    borderTop: '1px solid rgba(255,255,255,0.12)',
    padding: isNarrow
      ? '12px max(12px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left))'
      : '12px 18px 16px',
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(10px)',
  },
  formRow: {
    display: 'flex',
    gap: 10,
    alignItems: isNarrow ? 'stretch' : 'center',
    marginTop: 0,
    flexWrap: 'wrap',
    flexDirection: isNarrow ? 'column' : 'row',
  },
  input: {
    flex: isNarrow ? '1 1 auto' : '1 1 320px',
    width: isNarrow ? '100%' : undefined,
    minWidth: isNarrow ? 0 : 260,
    maxWidth: isNarrow ? '100%' : undefined,
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
  randomHintBtn: {
    padding: '10px 12px',
    borderRadius: 12,
    border: '1px solid rgba(232, 197, 71, 0.45)',
    background: 'rgba(0,0,0,0.18)',
    color: 'inherit',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
    whiteSpace: 'nowrap',
  },
  randomHintBtnDisabled: { opacity: 0.55, cursor: 'not-allowed' },
  hint: { marginTop: 8, opacity: 0.75, fontSize: 13 },
  versionTag: { fontSize: 12, opacity: 0.55, marginRight: 4 },
  };
}
