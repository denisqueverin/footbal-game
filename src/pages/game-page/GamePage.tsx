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
  isCpuControlledTeam,
  isNationalDraftSource,
  isUnfairCpuDifficulty,
  supportsBestLineupHint,
} from '@/entities/game/modes/gameMode';
import type { DraftSourceKind, GameMode, GameState, TeamId } from '@/entities/game/core/types';
import {
  existingPickedPlayerNames,
  pickEmergencyCpuDraftPlayer,
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
import {
  pickBestUnfairCpuAnyPosition,
  pickBestUnfairCpuPlayer,
  pickUnfairCpuDupOk,
} from '@/entities/game/hints/unfairCpuPool';

import { APP_VERSION } from '@/shared/config/version';
import { schemeAccent } from '@/shared/lib/schemeAccent';
import { BestLineupModal } from '@/shared/ui/best-lineup-modal';
import { ConfirmNewGameModal } from '@/shared/ui/confirm-new-game-modal';
import { RandomPlayerHintModal } from '@/shared/ui/random-player-hint-modal/RandomPlayerHintModal';
import { RoundIntroModal } from '@/shared/ui/round-intro-modal';
import { TeamBoard } from '@/shared/ui/team-board';

import { ROUND_MODAL_EXIT_MS, ROUND_MODAL_MS } from './game-page.constants';
import { formatDraftDuration, getDraftElapsedMs, getTeamDraftThinkingMs } from './game-page.utils';
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
  const { state, onConfirmPick, onUseRandomPlayerHint } = props;
  const isNarrow = useMediaQuery('(max-width: 640px)');
  const styles = useMemo(() => getGamePageStyles(isNarrow), [isNarrow]);
  const activeTeam = state.turn;
  const gameStateRef = useRef(state);
  gameStateRef.current = state;
  const onConfirmPickRef = useRef(onConfirmPick);
  onConfirmPickRef.current = onConfirmPick;

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
  const isCpuActiveTurn =
    state.phase === 'drafting' &&
    state.draftTimerPausedAt == null &&
    Boolean(state.currentCountry) &&
    state.teamControllers?.[activeTeam] === 'cpu';

  const canConfirm = useMemo(() => {
    return (
      !isCpuActiveTurn &&
      Boolean(state.currentCountry) &&
      Boolean(slotId) &&
      !activeSlotTaken &&
      playerName.trim().length > 0
    );
  }, [activeSlotTaken, isCpuActiveTurn, playerName, slotId, state.currentCountry]);

  const roundTurnSequence = useMemo(
    () =>
      state.roundIndex > 0
        ? roundTurnOrder(state.teamOrder, state.draftTurnOrderBase, state.roundIndex)
        : [],
    [state.draftTurnOrderBase, state.roundIndex, state.teamOrder],
  );

  const nextRoundTurnSequence = useMemo(
    () =>
      state.roundIndex > 0 && state.roundIndex < state.maxRounds
        ? roundTurnOrder(state.teamOrder, state.draftTurnOrderBase, state.roundIndex + 1)
        : [],
    [state.draftTurnOrderBase, state.maxRounds, state.roundIndex, state.teamOrder],
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
    !isCpuControlledTeam(state, activeTeam) &&
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
    onUseRandomPlayerHint(activeTeam, slotId);
  }, [activeTeam, onUseRandomPlayerHint, slotId]);

  /** Стабильный ключ «момента» черновика CPU: меняется при смене раунда/источника/хода/заполненности и настройках, влияющих на выбор. */
  const cpuDraftEffectId = useMemo(() => {
    if (state.phase !== 'drafting' || state.draftTimerPausedAt != null) return null;
    if (!state.currentCountry) return null;
    const t = state.turn;
    if (!isCpuControlledTeam(state, t)) return null;
    const picks = state.teams[t].picksBySlotId;
    const sig = Object.values(picks)
      .filter((p) => p.playerName)
      .map((p) => p.slotId)
      .sort()
      .join(',');
    const chaos = state.mode === 'chaos' ? String(state.currentDraftSourceKind ?? '') : '';
    const diff = String(state.cpuDifficultyByTeam[t] ?? '');
    return `${state.roundIndex}|${state.currentCountry}|${t}|${sig}|${state.mode}|${chaos}|${diff}`;
  }, [
    state.phase,
    state.draftTimerPausedAt,
    state.roundIndex,
    state.currentCountry,
    state.turn,
    state.mode,
    state.currentDraftSourceKind,
    state.gameKind,
    state.teamOrder,
    state.teamControllers,
    state.cpuDifficultyByTeam,
    state.teams,
  ]);

  // Ход компьютера: выбираем слот -> 3с лоадер -> подсветка -> подтверждение -> передача хода.
  useEffect(() => {
    if (cpuDraftEffectId == null) return;

    /** Пока на экране интро раунда (страна/клуб), не показываем лоадер выбора CPU. */
    if (roundModalOpen || roundModalExiting) return;

    const state = gameStateRef.current;
    const cpuTeamId: TeamId = state.turn;
    const source = state.currentCountry;
    if (!source) return;

    const team = state.teams[cpuTeamId];
    const emptySlots = Object.values(team.picksBySlotId).filter((p) => !p.playerName);
    if (emptySlots.length === 0) return;

    const usedNames = existingPickedPlayerNames(state);

    let picked: { name: string; stars: 1 | 2 | 3 | 4 | 5 } | null = null;
    let chosen = emptySlots[0]!;

    if (isUnfairCpuDifficulty(state.cpuDifficultyByTeam[cpuTeamId])) {
      const shuffled = [...emptySlots].sort(() => Math.random() - 0.5);
      let best: {
        slot: (typeof emptySlots)[number];
        name: string;
        stars: 1 | 2 | 3 | 4 | 5;
      } | null = null;
      for (const slot of shuffled) {
        const u = pickBestUnfairCpuPlayer({ slotLabel: slot.label, usedPlayerNames: usedNames });
        if (!u) continue;
        if (
          !best ||
          u.stars > best.stars ||
          (u.stars === best.stars && Math.random() < 0.5)
        ) {
          best = { slot, name: u.playerName, stars: u.stars };
        }
      }
      if (best) {
        chosen = best.slot;
        picked = { name: best.name, stars: best.stars };
      } else {
        const any = pickBestUnfairCpuAnyPosition({ usedPlayerNames: usedNames });
        if (any) {
          chosen = emptySlots.find((s) => s.label !== 'GK') ?? emptySlots[0]!;
          picked = { name: any.playerName, stars: any.stars };
        }
      }
      if (!picked) {
        const dup = pickUnfairCpuDupOk();
        if (dup) {
          chosen = emptySlots.find((s) => s.label !== 'GK') ?? emptySlots[0]!;
          picked = { name: dup.playerName, stars: dup.stars };
        }
      }
    } else {
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
          ? pickRandomTop15Player({ country: source, position, usedPlayerNames: usedNames })
          : effectiveMode === 'nationalTop30'
            ? pickRandomTop30Player({ country: source, position, usedPlayerNames: usedNames })
            : effectiveMode === 'rpl'
              ? pickRandomRplPlayer({ club: source, position, usedPlayerNames: usedNames })
              : pickRandomEuroClubPlayer({ club: source, position, usedPlayerNames: usedNames });
      if (!picked) return null;
      if (minStars != null && picked.stars < minStars) return null;
      return { name: picked.playerName, stars: picked.stars };
    };

    const difficulty = state.cpuDifficultyByTeam[cpuTeamId];

    const pickRandomAny = (): { name: string; stars: 1 | 2 | 3 | 4 | 5 } | null => {
      const any =
        effectiveMode === 'nationalTop15'
          ? pickRandomAnyTop15OutfieldPlayer({ country: source, usedPlayerNames: usedNames })
          : effectiveMode === 'nationalTop30'
            ? pickRandomAnyTop30OutfieldPlayer({ country: source, usedPlayerNames: usedNames })
            : effectiveMode === 'rpl'
              ? pickRandomAnyRplOutfieldPlayer({ club: source, usedPlayerNames: usedNames })
              : pickRandomAnyEuroClubOutfieldPlayer({ club: source, usedPlayerNames: usedNames });
      return any ? { name: any.playerName, stars: any.stars } : null;
    };

    const pickBestByPosition = (
      position: string,
      usedPlayerNames: readonly string[],
    ): { name: string; stars: 1 | 2 | 3 | 4 | 5 } | null => {
      const picked =
        effectiveMode === 'nationalTop15'
          ? pickBestTop15Player({ country: source, position, usedPlayerNames })
          : effectiveMode === 'nationalTop30'
            ? pickBestTop30Player({ country: source, position, usedPlayerNames })
            : effectiveMode === 'rpl'
              ? pickBestRplPlayer({ club: source, position, usedPlayerNames })
              : pickBestEuroClubPlayer({ club: source, position, usedPlayerNames });
      return picked ? { name: picked.playerName, stars: picked.stars } : null;
    };

    const countByPosition = (position: string, usedPlayerNames: readonly string[]): number => {
      return effectiveMode === 'nationalTop15'
        ? countAvailableTop15Players({ country: source, position, usedPlayerNames })
        : effectiveMode === 'nationalTop30'
          ? countAvailableTop30Players({ country: source, position, usedPlayerNames })
          : effectiveMode === 'rpl'
            ? countAvailableRplPlayers({ club: source, position, usedPlayerNames })
            : countAvailableEuroClubPlayers({ club: source, position, usedPlayerNames });
    };

    const pickBestAnyOutfield = (
      usedPlayerNames: readonly string[],
    ): { name: string; stars: 1 | 2 | 3 | 4 | 5 } | null => {
      const picked =
        effectiveMode === 'nationalTop15'
          ? pickBestAnyTop15OutfieldPlayer({ country: source, usedPlayerNames })
          : effectiveMode === 'nationalTop30'
            ? pickBestAnyTop30OutfieldPlayer({ country: source, usedPlayerNames })
            : effectiveMode === 'rpl'
              ? pickBestAnyRplOutfieldPlayer({ club: source, usedPlayerNames })
              : pickBestAnyEuroClubOutfieldPlayer({ club: source, usedPlayerNames });
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

    /** Порядок имён позиций в пуле: сначала ярлык слота, затем алиасы (см. формации LAM/RAM/RWB). */
    const positionSearchOrder = (slotLabel: string): string[] => [
      ...new Set([slotLabel, ...positionAliases(slotLabel)]),
    ];

    const opponentNeedCountForLabel = (label: string): number => {
      // Сколько других активных команд ещё не закрыли позицию (по ярлыку слота).
      // Это простой «контрдрафт»: при прочих равных закрываем то, что нужно соперникам.
      let n = 0;
      for (const teamId of state.teamOrder) {
        if (teamId === cpuTeamId) continue;
        const t = state.teams[teamId];
        for (const pick of Object.values(t.picksBySlotId)) {
          if (pick.label !== label) continue;
          if (!pick.playerName) n += 1;
        }
      }
      return n;
    };

    type HardMove = {
      slotId: string;
      slotLabel: string;
      pick: { name: string; stars: 1 | 2 | 3 | 4 | 5 };
      scarcity: number;
      oppNeed: number;
    };

    const bestHardMove = (
      slots: Array<{ slotId: string; label: string }>,
      usedPlayerNames: readonly string[],
    ): HardMove | null => {
      const moves: HardMove[] = [];

      for (const slot of slots) {
        const labelsToTry = positionSearchOrder(slot.label);
        const variants = labelsToTry
          .map((pos) => {
            const best = pickBestByPosition(pos, usedPlayerNames);
            if (!best) return null;
            const count = countByPosition(pos, usedPlayerNames);
            return { best, count };
          })
          .filter((v) => v != null);
        if (variants.length === 0) continue;

        // Лучший вариант для слота: max stars, при равенстве — min count (дефицит).
        variants.sort((a, b) => {
          if (a!.best.stars !== b!.best.stars) return b!.best.stars - a!.best.stars;
          return a!.count - b!.count;
        });
        const topStars = variants[0]!.best.stars;
        const top = variants.filter((v) => v!.best.stars === topStars);
        const minCount = Math.min(...top.map((v) => v!.count));
        const finalists = top.filter((v) => v!.count === minCount);
        const chosenVariant = finalists[Math.floor(Math.random() * finalists.length)]!;

        moves.push({
          slotId: slot.slotId,
          slotLabel: slot.label,
          pick: chosenVariant.best,
          scarcity: chosenVariant.count,
          oppNeed: opponentNeedCountForLabel(slot.label),
        });
      }

      if (moves.length === 0) return null;

      // Сортировка ходов:
      // 1) max stars
      // 2) min scarcity
      // 3) max oppNeed (контрдрафт)
      moves.sort((a, b) => {
        if (a.pick.stars !== b.pick.stars) return b.pick.stars - a.pick.stars;
        if (a.scarcity !== b.scarcity) return a.scarcity - b.scarcity;
        return b.oppNeed - a.oppNeed;
      });

      const best = moves[0]!;
      // Немного рандома среди полностью равных ходов, чтобы игра не была «одной и той же».
      const equals = moves.filter(
        (m) =>
          m.pick.stars === best.pick.stars &&
          m.scarcity === best.scarcity &&
          m.oppNeed === best.oppNeed,
      );
      return equals[Math.floor(Math.random() * equals.length)]!;
    };

    chosen = emptySlots[Math.floor(Math.random() * emptySlots.length)]!;
    if (difficulty === 'beginner') {
      chosen = emptySlots[Math.floor(Math.random() * emptySlots.length)]!;
      // Начинающий: 4★+ на подходящую позицию (с алиасами слота), иначе любой доступный на те же позиции.
      const slotIsGk = chosen.label === 'GK';
      for (const pos of positionSearchOrder(chosen.label)) {
        const p = pickByPosition(pos, 4) ?? pickByPosition(pos, null);
        if (p) {
          picked = p;
          break;
        }
      }
      if (!picked) {
        picked = slotIsGk ? pickByPosition('GK', null) : pickRandomAny();
      }
    } else if (difficulty === 'hard') {
      // Усиленный hard:
      // 1) Базовый ход как раньше (stars + дефицитность),
      // 2) плюс «контрдрафт» (oppNeed),
      // 3) плюс планирование на 1 шаг вперёд: оцениваем следующий ход CPU после взятия кандидата.
      const current = bestHardMove(emptySlots, usedNames);
      if (current) {
        // Если следующий ход резко ухудшается из-за дефицита (например, остаётся только GK без кандидатов),
        // пробуем альтернативы: перебор топ-N ходов и выбираем по суммарной оценке.
        const candidates: HardMove[] = [];
        // Соберём небольшой пул альтернатив (до 8), чтобы не тормозить UI.
        for (const slot of emptySlots) {
          const one = bestHardMove([slot], usedNames);
          if (one) candidates.push(one);
        }
        // Уберём дубликаты слотов.
        const uniqueBySlot = new Map<string, HardMove>();
        for (const c of candidates) uniqueBySlot.set(c.slotId, c);
        const uniq = Array.from(uniqueBySlot.values());
        uniq.sort((a, b) => {
          if (a.pick.stars !== b.pick.stars) return b.pick.stars - a.pick.stars;
          if (a.scarcity !== b.scarcity) return a.scarcity - b.scarcity;
          return b.oppNeed - a.oppNeed;
        });
        const top = uniq.slice(0, 8);

        const scoreMove = (m: HardMove): number => {
          // stars — доминанта, scarcity — штраф, oppNeed — лёгкий бонус.
          const base = m.pick.stars * 10000 - m.scarcity * 25 + m.oppNeed * 40;
          const usedA = [...usedNames, m.pick.name];
          const rest = emptySlots.filter((s) => s.slotId !== m.slotId);
          const nextM = bestHardMove(rest, usedA);
          if (!nextM) return base;
          const nextScore = nextM.pick.stars * 10000 - nextM.scarcity * 25 + nextM.oppNeed * 40;
          // Смотрим вперёд с дисконтом (чтобы текущий ход всё равно был важнее).
          return base + Math.floor(nextScore * 0.55);
        };

        const best = top.length > 0 ? top.reduce((best, m) => (scoreMove(m) > scoreMove(best) ? m : best), top[0]!) : current;

        chosen = emptySlots.find((s) => s.slotId === best.slotId) ?? chosen;
        picked = best.pick;
      } else {
        // Fallback: если профильного нет ни на один свободный слот — берём самого сильного полевого игрока.
        const outfieldSlots = emptySlots.filter((s) => s.label !== 'GK');
        const bestOutfield = pickBestAnyOutfield(usedNames);
        if (bestOutfield && outfieldSlots.length > 0) {
          chosen = outfieldSlots[Math.floor(Math.random() * outfieldSlots.length)]!;
          picked = bestOutfield;
        } else {
          // Если остался только GK (или нет полевого игрока) — пытаемся подобрать GK.
          const gkSlot = emptySlots.find((s) => s.label === 'GK');
          const bestGk = pickBestByPosition('GK', usedNames);
          if (gkSlot && bestGk) {
            chosen = gkSlot;
            picked = bestGk;
          } else {
            picked = pickRandomAny();
          }
        }
      }
    } else {
      // normal: логика как у hard (алгоритм из hard).
      const moves = emptySlots
        .map((slot) => {
          const labelsToTry = positionSearchOrder(slot.label);
          const variants = labelsToTry
            .map((pos) => {
              const best = pickBestByPosition(pos, usedNames);
              if (!best) return null;
              const count = countByPosition(pos, usedNames);
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
        const bestOutfield = pickBestAnyOutfield(usedNames);
        if (bestOutfield && outfieldSlots.length > 0) {
          chosen = outfieldSlots[Math.floor(Math.random() * outfieldSlots.length)]!;
          picked = bestOutfield;
        } else {
          // Если остался только GK (или нет полевого игрока) — пытаемся подобрать GK.
          const gkSlot = emptySlots.find((s) => s.label === 'GK');
          const bestGk = pickBestByPosition('GK', usedNames);
          if (gkSlot && bestGk) {
            chosen = gkSlot;
            picked = bestGk;
          } else {
            picked = pickRandomAny();
          }
        }
      }
    }

    // Слот/позиция могли стать «пустыми» после выборов соперников — пробуем любой другой свободный слот.
    if (!picked) {
      const shuffled = [...emptySlots].sort(() => Math.random() - 0.5);
      outer: for (const slot of shuffled) {
        for (const pos of positionSearchOrder(slot.label)) {
          const b = pickBestByPosition(pos, usedNames);
          if (b) {
            chosen = slot;
            picked = b;
            break outer;
          }
        }
      }
    }

    // Последний шанс: если из-за фильтра имён не нашли никого, разрешаем дубль, но берём реального игрока.
    if (!picked) {
      const noFilter: string[] = [];
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

    if (!picked) {
      const emerg = pickEmergencyCpuDraftPlayer({ effectiveMode, source });
      if (emerg) {
        const target = emptySlots.find((s) => s.label !== 'GK') ?? emptySlots[0]!;
        chosen = target;
        picked = { name: emerg.playerName, stars: emerg.stars };
      }
    }
    }

    const pickedName = picked?.name ?? 'Игрок CPU';
    const pickedStars = picked?.stars ?? null;

    // 1) Показать лоадер в выбранном слоте.
    setCpuPending({ slotId: chosen.slotId, pickedName, pickedStars });

    // 2) Через 3 секунды — подсветить слот.
    let t2: number | null = null;
    const t1 = window.setTimeout(() => {
      setCpuPending(null);
      setSlotId(chosen.slotId);

      // 3) Небольшая пауза, чтобы подсветка была заметна, затем подтвердить выбор и передать ход.
      t2 = window.setTimeout(() => {
        t2 = null;
        onConfirmPickRef.current(cpuTeamId, chosen.slotId, pickedName, pickedStars, 'cpu');
      }, 250);
    }, 3000);

    return () => {
      window.clearTimeout(t1);
      if (t2 != null) window.clearTimeout(t2);
    };
  }, [cpuDraftEffectId, roundModalExiting, roundModalOpen]);

  const draftTimePills = state.teamOrder.map((teamId) => {
    const team = state.teams[teamId];
    const ms = getTeamDraftThinkingMs(state, teamId, now);
    return (
      <span key={teamId} className="game-turn-order-draft-time-pill">
        <span className="game-turn-order-draft-time-name" style={{ color: schemeAccent(team.colorScheme) }}>
          {team.name}
        </span>
        <span className="game-turn-order-draft-time-val">{formatDraftDuration(ms)}</span>
      </span>
    );
  });

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
        <div className="game-turn-order" aria-label="Очерёдность ходов в раундах">
          <div className="game-turn-order-layout">
            <div className="game-turn-order-main">
              <div className="game-turn-order-rounds-row">
                <div className="game-turn-order-segment">
                  <div className="game-turn-order-label">
                    Раунд {state.roundIndex} — очередность ходов
                  </div>
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
                {nextRoundTurnSequence.length > 0 ? (
                  <div className="game-turn-order-segment game-turn-order-segment--next">
                    <div className="game-turn-order-label game-turn-order-label--next">
                      Следующий раунд — очередность ходов
                    </div>
                    <div className="game-turn-order-chips game-turn-order-chips--muted">
                      {nextRoundTurnSequence.map((teamId, index) => {
                        const team = state.teams[teamId];

                        return (
                          <span
                            key={`next-${state.roundIndex + 1}-${teamId}-${index}`}
                            className="game-turn-chip game-turn-chip--next-preview"
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
              </div>
            </div>
            <div className="game-turn-order-times" aria-label="Время на ходах по командам">
              {draftTimePills}
            </div>
          </div>
        </div>
      ) : null}

      {isEditingLineups ? (
        <LineupEditor state={state} onPickNameChange={handleLineupPickNameChange} />
      ) : (
        <>
          <div style={styles.bottom}>
            {roundTurnSequence.length === 0 ? (
              <div
                className="game-turn-order-draft-times game-turn-order-draft-times--in-bottom"
                aria-label="Время на ходах по командам"
              >
                {draftTimePills}
              </div>
            ) : null}
            <div style={styles.formRow}>
              <input
                value={playerName}
                onChange={handlePlayerNameChange}
                onKeyDown={handlePlayerNameKeyDown}
                placeholder={isCpuActiveTurn ? 'Ход компьютера…' : 'Имя футболиста (свободный ввод)'}
                style={styles.input}
                disabled={isCpuActiveTurn}
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
          <div style={styles.draftMain}>
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
                      state.teamControllers?.[teamId] === 'cpu' &&
                      state.turn === teamId &&
                      cpuPending != null
                        ? { slotId: cpuPending.slotId }
                        : null
                    }
                    bestLineupHint={
                      supportsBestLineupHint(state.mode) &&
                      state.hintsBudgetPerPlayer > 0 &&
                      state.phase === 'drafting' &&
                      !isEditingLineups &&
                      Boolean(state.currentCountry) &&
                      !isCpuControlledTeam(state, teamId)
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
  page: { minHeight: '100dvh', display: 'flex', flexDirection: 'column' },
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
  draftMain: {
    flex: '1 1 auto',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  boards: {
    flex: '1 1 auto',
    minHeight: 0,
    maxHeight: isNarrow
      ? 'calc(100dvh - min(300px, 58dvh))'
      : 'calc(100dvh - min(320px, 46dvh))',
    overflow: 'auto',
    display: 'grid',
    gridTemplateColumns: isNarrow
      ? '1fr'
      : 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
    gap: isNarrow ? 10 : 12,
    padding: isNarrow
      ? '8px max(8px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left))'
      : '10px 12px max(12px, env(safe-area-inset-bottom)) 12px',
    alignItems: 'stretch',
  },
  side: {
    position: 'relative',
    minHeight: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
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
