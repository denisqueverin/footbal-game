import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useMediaQuery } from '@/shared/lib/useMediaQuery';

import { getClubFlagUrl } from '@/entities/game/data/clubCountries';
import { roundTurnOrder } from '@/entities/game/core/turnOrder';
import { getCountryFlagUrlRu } from '@/entities/game/data/topCountries';
import {
  formatTeamDisplayName,
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
import { CaptainPickIntroModal } from '@/shared/ui/captain-pick-intro-modal';
import { RoundIntroModal } from '@/shared/ui/round-intro-modal';
import { CpuDifficultyIcon } from '@/shared/ui/cpu-difficulty-icon';
import { TeamBoard } from '@/shared/ui/team-board';

import { ROUND_MODAL_EXIT_MS, ROUND_MODAL_MS } from './game-page.constants';
import { formatDraftDuration, getDraftElapsedMs, getTeamDraftThinkingMs } from './game-page.utils';
import { LineupEditor } from './ui/LineupEditor';

function draftBoardsCarouselScrollBehavior(): ScrollBehavior {
  if (typeof window === 'undefined') return 'auto';
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

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
  /** Выбор капитана на досках после драфта (фаза `captainPick`). */
  onSelectCaptain?: (team: TeamId, slotId: string) => void;
}

export function GamePage(props: GamePageProps) {
  const { state, onConfirmPick, onUseRandomPlayerHint, onSelectCaptain } = props;
  const activeTeam = state.turn;
  const isCaptainPick = state.phase === 'captainPick';
  const interactiveTeamId: TeamId =
    isCaptainPick && state.captainPick != null
      ? (state.teamOrder[state.captainPick.activeIndex] ?? state.turn)
      : state.turn;

  /** Стабильный ключ шага капитана — без лишних перезапусков модалки при прочих обновлениях state. */
  const captainIntroKey = useMemo(() => {
    if (state.phase !== 'captainPick' || !state.captainPick) return '';
    const i = state.captainPick.activeIndex;
    return `${i}|${state.teamOrder[i] ?? ''}`;
  }, [state.phase, state.captainPick?.activeIndex, state.teamOrder]);
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
  const [captainModalOpen, setCaptainModalOpen] = useState(false);
  const [captainModalExiting, setCaptainModalExiting] = useState(false);
  /** Увеличивается при «Завершить редактирование» — заново показываем интро текущего раунда. */
  const [resumeModalEpoch, setResumeModalEpoch] = useState(0);
  const [bestLineupOpen, setBestLineupOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  /** Панель «очередность + время»: по умолчанию свёрнута; развернуть — кнопка «Очередь и время». */
  const [turnOrderPanelOpen, setTurnOrderPanelOpen] = useState(false);
  /** Правка имени уже выбранного игрока (карандаш на слоте). */
  const [pickedFilledEdit, setPickedFilledEdit] = useState<null | { teamId: TeamId; slotId: string; draft: string }>(
    null,
  );
  const turnOrderPanelContentId = useId();
  const isNarrowTurnPanel = useMediaQuery('(max-width: 640px)');
  const roundModalTimersRef = useRef<{ exit?: number; hide?: number }>({});
  const captainModalTimersRef = useRef<{ exit?: number; hide?: number }>({});
  const boardsCarouselRef = useRef<HTMLDivElement>(null);

  const scrollBoardsCarouselBy = useCallback((dir: -1 | 1) => {
    const el = boardsCarouselRef.current;
    if (!el) return;
    el.scrollBy({
      left: Math.max(160, el.clientWidth * 0.45) * dir,
      behavior: draftBoardsCarouselScrollBehavior(),
    });
  }, []);

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

  const clearCaptainModalTimers = useCallback(() => {
    const timers = captainModalTimersRef.current;
    if (timers.exit !== undefined) {
      window.clearTimeout(timers.exit);
    }
    if (timers.hide !== undefined) {
      window.clearTimeout(timers.hide);
    }
    captainModalTimersRef.current = {};
  }, []);

  const handleCloseCaptainModal = useCallback(() => {
    clearCaptainModalTimers();
    setCaptainModalExiting(true);
    captainModalTimersRef.current.hide = window.setTimeout(() => {
      setCaptainModalOpen(false);
      setCaptainModalExiting(false);
      captainModalTimersRef.current = {};
    }, ROUND_MODAL_EXIT_MS);
  }, [clearCaptainModalTimers]);

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

  const teamNameCtx = useMemo(
    () => ({
      gameKind: state.gameKind,
      teamOrder: state.teamOrder,
      teamControllers: state.teamControllers,
    }),
    [state.gameKind, state.teamOrder, state.teamControllers],
  );

  const teamDisplayName = useCallback(
    (teamId: TeamId) => formatTeamDisplayName(teamNameCtx, teamId, state.teams[teamId].name),
    [teamNameCtx, state.teams],
  );

  const isEditingLineups = state.draftTimerPausedAt != null;
  const twoTeamDraft = state.teamOrder.length === 2;
  const showBoardsCarouselNav = state.teamOrder.length > 2;

  useEffect(() => {
    if ((state.phase !== 'drafting' && state.phase !== 'captainPick') || isEditingLineups) return;
    const vp = boardsCarouselRef.current;
    if (!vp) return;
    const slide = vp.querySelector<HTMLElement>(`[data-game-board-slide="${interactiveTeamId}"]`);
    if (!slide) return;
    let cancelled = false;
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (cancelled) return;
        const targetLeft = slide.offsetLeft;
        vp.scrollTo({ left: targetLeft, behavior: draftBoardsCarouselScrollBehavior() });
      });
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(id);
    };
  }, [state.phase, state.turn, state.roundIndex, isEditingLineups, state.teamOrder]);

  /** Карусель только кнопками: без полосы прокрутки и без горизонтального колеса над вьюпортом. */
  useEffect(() => {
    if ((state.phase !== 'drafting' && state.phase !== 'captainPick') || isEditingLineups) return;
    const el = boardsCarouselRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [state.phase, isEditingLineups]);

  useEffect(() => {
    if (state.phase === 'captainPick') {
      setPlayerName('');
      setSlotId(null);
      setCpuPending(null);
    }
    if (state.phase !== 'drafting') {
      setPickedFilledEdit(null);
    }
  }, [state.phase]);

  useEffect(() => {
    if (isEditingLineups) {
      setPickedFilledEdit(null);
    }
  }, [isEditingLineups]);

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
    setPlayerName('');
  }, [interactiveTeamId]);

  useEffect(() => {
    setPlayerName('');
  }, [slotId]);

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

  useEffect(() => {
    if (!captainIntroKey) {
      clearCaptainModalTimers();
      setCaptainModalOpen(false);
      setCaptainModalExiting(false);
      return;
    }

    const s = gameStateRef.current;
    if (!s.captainPick) {
      clearCaptainModalTimers();
      setCaptainModalOpen(false);
      setCaptainModalExiting(false);
      return;
    }

    const tid = s.teamOrder[s.captainPick.activeIndex];
    if (!tid || isCpuControlledTeam(s, tid)) {
      clearCaptainModalTimers();
      setCaptainModalOpen(false);
      setCaptainModalExiting(false);
      return;
    }

    clearCaptainModalTimers();
    setCaptainModalOpen(true);
    setCaptainModalExiting(false);

    captainModalTimersRef.current.exit = window.setTimeout(() => {
      setCaptainModalExiting(true);
    }, ROUND_MODAL_MS);

    captainModalTimersRef.current.hide = window.setTimeout(() => {
      setCaptainModalOpen(false);
      setCaptainModalExiting(false);
      captainModalTimersRef.current = {};
    }, ROUND_MODAL_MS + ROUND_MODAL_EXIT_MS);

    return () => {
      clearCaptainModalTimers();
    };
  }, [captainIntroKey, clearCaptainModalTimers]);

  const handleConfirmPick = useCallback(() => {
    if (!slotId) {
      return;
    }

    props.onConfirmPick(activeTeam, slotId, playerName);
    setPlayerName('');
    setSlotId(null);
  }, [activeTeam, playerName, props.onConfirmPick, slotId]);

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

  const openFilledPickEdit = useCallback((teamId: TeamId, slotId: string) => {
    const name = state.teams[teamId].picksBySlotId[slotId]?.playerName;
    if (!name) return;
    setPickedFilledEdit({ teamId, slotId, draft: name });
  }, [state.teams]);

  const closeFilledPickEdit = useCallback(() => {
    setPickedFilledEdit(null);
  }, []);

  const updateFilledPickDraft = useCallback((value: string) => {
    setPickedFilledEdit((prev) => (prev ? { ...prev, draft: value } : null));
  }, []);

  const saveFilledPickEdit = useCallback(() => {
    if (!pickedFilledEdit) return;
    const trimmed = pickedFilledEdit.draft.trim();
    if (!trimmed) return;
    props.onSetPickPlayerName(pickedFilledEdit.teamId, pickedFilledEdit.slotId, trimmed);
    setPickedFilledEdit(null);
  }, [pickedFilledEdit, props]);

  const handleLineupPickNameChange = useCallback(
    (team: TeamId, slotId: string, name: string) => {
      props.onSetPickPlayerName(team, slotId, name);
    },
    [props],
  );

  const handleCaptainSlotPick = useCallback(
    (teamId: TeamId, slotId: string) => {
      if (state.phase !== 'captainPick' || !state.captainPick) return;
      const expected = state.teamOrder[state.captainPick.activeIndex];
      if (expected !== teamId) return;
      onSelectCaptain?.(teamId, slotId);
    },
    [state.phase, state.captainPick, state.teamOrder, onSelectCaptain],
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
    pickedFilledEdit == null &&
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

    /** Пока на экране интро раунда или капитана — не показываем лоадер выбора CPU. */
    if (roundModalOpen || roundModalExiting || captainModalOpen || captainModalExiting) return;

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
  }, [cpuDraftEffectId, roundModalExiting, roundModalOpen, captainModalExiting, captainModalOpen]);

  const draftTimePills = state.teamOrder.map((teamId) => {
    const team = state.teams[teamId];
    const ms = getTeamDraftThinkingMs(state, teamId, now);
    const cpuDiff = isCpuControlledTeam(state, teamId) ? state.cpuDifficultyByTeam[teamId] : null;
    return (
      <span key={teamId} className="game-turn-order-draft-time-pill">
        <span className="game-turn-order-draft-time-name" style={{ color: schemeAccent(team.colorScheme) }}>
          {teamDisplayName(teamId)}
          {cpuDiff != null ? (
            <CpuDifficultyIcon difficulty={cpuDiff} className="game-turn-order-draft-time-diff" />
          ) : null}
        </span>
        <span className="game-turn-order-draft-time-val">{formatDraftDuration(ms)}</span>
      </span>
    );
  });

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
        autoCloseMs={ROUND_MODAL_MS}
        onClose={handleCloseRoundModal}
      />
      <CaptainPickIntroModal
        key={`captain-${state.captainPick?.activeIndex ?? 0}-${interactiveTeamId}`}
        open={captainModalOpen}
        exiting={captainModalExiting}
        teamLabel={teamDisplayName(interactiveTeamId)}
        autoCloseMs={ROUND_MODAL_MS}
        onClose={handleCloseCaptainModal}
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
      <header className="game-topbar">
        {isCaptainPick ? (
          <>
            <div className="game-topbar-left">
              <p className="game-source-label">Капитан команды</p>
              <div className="game-source-value">
                <p className="game-source-name">
                  <strong>{teamDisplayName(interactiveTeamId)}</strong>
                </p>
              </div>
            </div>
            <div className="game-topbar-center" aria-live="polite">
              <p className="game-timer-cap">Итоги драфта</p>
              <p className="game-timer-val">Выберите капитана на поле</p>
            </div>
            <div className="game-topbar-right">
              <span className="game-version-tag">v{APP_VERSION}</span>
              <button type="button" onClick={handleResetClick} className="game-ghost-btn">
                Новая игра
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="game-topbar-left">
              <p className="game-source-label">
                {isChaosMode(state.mode)
                  ? 'Текущий источник'
                  : isClubsMode(state.mode)
                    ? 'Текущий клуб'
                    : 'Текущая страна'}
              </p>
              <div className="game-source-value">
                <p className="game-source-name">{state.currentCountry ?? '—'}</p>
                {currentSourceFlagUrl ? (
                  <img src={currentSourceFlagUrl} alt="" className="game-topbar-flag" width={36} height={24} />
                ) : null}
              </div>
            </div>

            <div className="game-topbar-center" aria-live="polite">
              <p className="game-timer-cap">Время игры</p>
              <p className="game-timer-val">{draftTimerLabel}</p>
            </div>

            <div className="game-topbar-right">
              {!isEditingLineups ? <span className="game-version-tag">v{APP_VERSION}</span> : null}
              {state.devToolsEnabled ? (
                <button
                  type="button"
                  onClick={handleToggleEditLineups}
                  className={isEditingLineups ? 'game-edit-done-btn' : 'game-ghost-btn'}
                >
                  {isEditingLineups ? 'Завершить редактирование' : 'Редактировать составы'}
                </button>
              ) : null}
              <button type="button" onClick={handleResetClick} className="game-ghost-btn">
                Новая игра
              </button>
            </div>
          </>
        )}
      </header>

      {!isEditingLineups && state.phase === 'drafting' && roundTurnSequence.length > 0 ? (
        <section
          className={`game-turn-order${turnOrderPanelOpen ? ' game-turn-order--open' : ' game-turn-order--closed'}`}
          aria-label="Очерёдность ходов и время по командам"
        >
          <div className="game-turn-order-bar">
            <div className="game-turn-order-summary" aria-live="polite">
              <span className="game-turn-order-summary-round">Раунд {state.roundIndex}</span>
              <span className="game-turn-order-summary-sep" aria-hidden="true">
                ·
              </span>
              <span className="game-turn-order-summary-turn">
                Ход: <strong>{teamDisplayName(state.turn)}</strong>
                {isCpuControlledTeam(state, state.turn) ? (
                  <CpuDifficultyIcon
                    difficulty={state.cpuDifficultyByTeam[state.turn]}
                    className="game-turn-order-summary-diff"
                  />
                ) : null}
              </span>
            </div>
            <button
              type="button"
              className="game-turn-order-toggle"
              aria-expanded={turnOrderPanelOpen}
              aria-controls={turnOrderPanelContentId}
              onClick={() => setTurnOrderPanelOpen((v) => !v)}
            >
              {turnOrderPanelOpen ? 'Свернуть' : 'Очередь и время'}
            </button>
          </div>
          <div
            id={turnOrderPanelContentId}
            className="game-turn-order-body"
            hidden={!turnOrderPanelOpen}
          >
            {isNarrowTurnPanel ? (
              <div className="game-turn-order-narrow">
                <div className="game-turn-order-narrow-block">
                  <div className="game-turn-order-narrow-round">Раунд {state.roundIndex}</div>
                  <p className="game-turn-order-narrow-order">
                    <span className="game-turn-order-narrow-kicker">Ход: </span>
                    {roundTurnSequence.map((teamId, index) => {
                      const isActive = state.turn === teamId;
                      const sep = index > 0 ? ' - ' : null;
                      const cpuDiff = isCpuControlledTeam(state, teamId) ? state.cpuDifficultyByTeam[teamId] : null;

                      return (
                        <span key={`${state.roundIndex}-${teamId}-${index}`}>
                          {sep}
                          <span className="game-turn-order-name-with-diff">
                            {isActive ? <strong>{teamDisplayName(teamId)}</strong> : teamDisplayName(teamId)}
                            {cpuDiff != null ? (
                              <CpuDifficultyIcon difficulty={cpuDiff} className="game-turn-order-inline-diff" />
                            ) : null}
                          </span>
                        </span>
                      );
                    })}
                  </p>
                </div>
                {nextRoundTurnSequence.length > 0 ? (
                  <div className="game-turn-order-narrow-block game-turn-order-narrow-block--next">
                    <div className="game-turn-order-narrow-round game-turn-order-narrow-round--next">
                      Следующий раунд {state.roundIndex + 1}
                    </div>
                    <p className="game-turn-order-narrow-order game-turn-order-narrow-order--next">
                      <span className="game-turn-order-narrow-kicker">Ход: </span>
                      {nextRoundTurnSequence.map((teamId, index) => {
                        const sep = index > 0 ? ' - ' : null;
                        const cpuDiff = isCpuControlledTeam(state, teamId) ? state.cpuDifficultyByTeam[teamId] : null;

                        return (
                          <span key={`next-${state.roundIndex + 1}-${teamId}-${index}`}>
                            {sep}
                            <span className="game-turn-order-name-with-diff">
                              {teamDisplayName(teamId)}
                              {cpuDiff != null ? (
                                <CpuDifficultyIcon difficulty={cpuDiff} className="game-turn-order-inline-diff" />
                              ) : null}
                            </span>
                          </span>
                        );
                      })}
                    </p>
                  </div>
                ) : null}
                <div className="game-turn-order-narrow-times" aria-label="Время на ходах по командам">
                  {draftTimePills}
                </div>
              </div>
            ) : (
              <div className="game-turn-order-layout">
                <div className="game-turn-order-main">
                  <div className="game-turn-order-rounds-row">
                    <div className="game-turn-order-segment">
                      <div className="game-turn-order-label">Раунд {state.roundIndex} — очередность ходов</div>
                      <div className="game-turn-order-chips">
                        {roundTurnSequence.map((teamId, index) => {
                          const team = state.teams[teamId];
                          const isActive = state.turn === teamId;
                          const cpuDiff = isCpuControlledTeam(state, teamId) ? state.cpuDifficultyByTeam[teamId] : null;

                          return (
                            <span
                              key={`${state.roundIndex}-${teamId}-${index}`}
                              className={`game-turn-chip${isActive ? ' game-turn-chip--active' : ''}`}
                              style={{ ['--chip-accent' as string]: schemeAccent(team.colorScheme) }}
                            >
                              <span className="game-turn-chip-num">{index + 1}</span>
                              <span className="game-turn-chip-name-row">
                                {teamDisplayName(teamId)}
                                {cpuDiff != null ? (
                                  <CpuDifficultyIcon difficulty={cpuDiff} className="game-turn-chip-diff" />
                                ) : null}
                              </span>
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
                            const cpuDiff = isCpuControlledTeam(state, teamId) ? state.cpuDifficultyByTeam[teamId] : null;

                            return (
                              <span
                                key={`next-${state.roundIndex + 1}-${teamId}-${index}`}
                                className="game-turn-chip game-turn-chip--next-preview"
                                style={{ ['--chip-accent' as string]: schemeAccent(team.colorScheme) }}
                              >
                                <span className="game-turn-chip-num">{index + 1}</span>
                                <span className="game-turn-chip-name-row">
                                  {teamDisplayName(teamId)}
                                  {cpuDiff != null ? (
                                    <CpuDifficultyIcon difficulty={cpuDiff} className="game-turn-chip-diff" />
                                  ) : null}
                                </span>
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
            )}
          </div>
        </section>
      ) : null}

      {isEditingLineups ? (
        <LineupEditor state={state} onPickNameChange={handleLineupPickNameChange} />
      ) : (
        <>
          <div className="game-bottom">
            {state.phase === 'drafting' && roundTurnSequence.length === 0 ? (
              <div
                className="game-turn-order-draft-times game-turn-order-draft-times--in-bottom"
                aria-label="Время на ходах по командам"
              >
                {draftTimePills}
              </div>
            ) : null}
            <p className="game-hint">
              {isCaptainPick
                ? `Капитан команды «${teamDisplayName(interactiveTeamId)}»: нажмите на карточку игрока на поле ниже — он получит капитанскую повязку.`
                : isCpuActiveTurn
                  ? 'Ход компьютера…'
                  : twoTeamDraft
                    ? 'Нажмите на свободную позицию на поле, введите имя в ячейке и нажмите ✓. Подсказка «случайный игрок» — кнопка с ? в ячейке (если доступна). Доски обеих команд на экране рядом.'
                    : 'Нажмите на свободную позицию на поле, введите имя в ячейке и нажмите ✓. Подсказка «случайный игрок» — кнопка с ? в ячейке (если доступна). Доски команд — карусель: видны команда с ходом и следующая; другие команды — кнопками ‹ › по бокам.'}
            </p>
          </div>
          <div className="game-draft-main">
            <div
              className={`game-boards-carousel-shell${twoTeamDraft ? ' game-boards-carousel-shell--two-teams' : ''}`}
            >
              {showBoardsCarouselNav ? (
                <button
                  type="button"
                  className="game-boards-carousel-nav"
                  aria-label="Прокрутить доски команд влево"
                  onClick={() => scrollBoardsCarouselBy(-1)}
                >
                  ‹
                </button>
              ) : null}
              <div ref={boardsCarouselRef} className="game-boards-carousel-viewport">
                <div className="game-boards-carousel-track">
                  {state.teamOrder.map((teamId) => (
                    <div
                      key={teamId}
                      className="game-board-slide"
                      data-game-board-slide={teamId}
                      data-active-turn={teamId === interactiveTeamId ? 'true' : undefined}
                    >
                      <div className="game-side">
                  <TeamBoard
                    team={state.teams[teamId]}
                    teamDisplayName={teamDisplayName(teamId)}
                    formation={state.teams[teamId].formation}
                    mode={state.mode}
                    selectedSlotId={interactiveTeamId === teamId ? slotId : null}
                    onSelectSlot={interactiveTeamId === teamId && !isCaptainPick ? setSlotId : undefined}
                    captainPickOnSlot={
                      isCaptainPick &&
                      teamId === interactiveTeamId &&
                      !isCpuControlledTeam(state, teamId)
                        ? (sid) => handleCaptainSlotPick(teamId, sid)
                        : undefined
                    }
                    slotDraftEditor={
                      !isCaptainPick &&
                      interactiveTeamId === teamId &&
                      !isCpuActiveTurn &&
                      slotId
                        ? {
                            slotId,
                            value: playerName,
                            onChange: setPlayerName,
                            onConfirm: handleConfirmPick,
                            confirmDisabled: !canConfirm,
                            onRandom:
                              state.mode === 'nationalTop15' ||
                              state.mode === 'nationalTop30' ||
                              state.mode === 'rpl' ||
                              state.mode === 'clubs' ||
                              state.mode === 'chaos'
                                ? handleUseRandomHint
                                : undefined,
                            randomDisabled: !canUseRandomHint,
                            randomTitle: canUseRandomHint
                              ? 'Поставить случайного игрока этой позиции из текущей сборной'
                              : randomHintRemaining <= 0
                                ? 'Подсказки «Случайный игрок» закончились'
                                : !slotId
                                  ? 'Сначала выберите слот'
                                  : activeSlotTaken
                                    ? 'Слот уже занят'
                                    : !state.currentCountry
                                      ? 'Нет текущей сборной для раунда'
                                      : 'Подсказка недоступна',
                            confirmTitle: canConfirm
                              ? 'Подтвердить выбор'
                              : 'Введите имя игрока',
                          }
                        : null
                    }
                    disabled={interactiveTeamId !== teamId}
                    cpuDifficulty={
                      isCpuControlledTeam(state, teamId) ? state.cpuDifficultyByTeam[teamId] : null
                    }
                    pendingPick={
                      state.phase === 'drafting' &&
                      state.teamControllers?.[teamId] === 'cpu' &&
                      state.turn === teamId &&
                      cpuPending != null
                        ? { slotId: cpuPending.slotId }
                        : null
                    }
                    onRequestEditFilledPick={
                      state.phase === 'drafting' && !isEditingLineups
                        ? (sid) => openFilledPickEdit(teamId, sid)
                        : undefined
                    }
                    filledPickEditor={
                      pickedFilledEdit?.teamId === teamId
                        ? {
                            slotId: pickedFilledEdit.slotId,
                            value: pickedFilledEdit.draft,
                            onChange: updateFilledPickDraft,
                            onSave: saveFilledPickEdit,
                            onCancel: closeFilledPickEdit,
                            saveDisabled: pickedFilledEdit.draft.trim().length === 0,
                          }
                        : null
                    }
                    bestLineupHint={
                      supportsBestLineupHint(state.mode) &&
                      state.hintsBudgetPerPlayer > 0 &&
                      state.phase === 'drafting' &&
                      !isEditingLineups &&
                      pickedFilledEdit == null &&
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
                  {interactiveTeamId !== teamId && pickedFilledEdit == null ? (
                    <div className="game-side-overlay" aria-hidden="true" />
                  ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {showBoardsCarouselNav ? (
                <button
                  type="button"
                  className="game-boards-carousel-nav"
                  aria-label="Прокрутить доски команд вправо"
                  onClick={() => scrollBoardsCarouselBy(1)}
                >
                  ›
                </button>
              ) : null}
            </div>
          </div>
        </>
      )}

      {isEditingLineups ? (
        <div className="game-bottom-hint-only">
          <p className="game-hint">
            Редактируйте имена в списке выше и нажмите «Завершить редактирование», чтобы продолжить игру.
          </p>
        </div>
      ) : null}
    </div>
  );
}
