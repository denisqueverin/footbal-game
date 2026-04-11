import { coachProfileFor } from '@/entities/game/data/coachProfiles';
import { assignPlaceholderTeamNames } from '@/entities/game/data/teamNames';
import { computeBestLineupIncludeBench } from '@/entities/game/core/bestLineupBenchRule';
import type {
  CpuDifficultyByTeam,
  DraftSourceKind,
  GameMode,
  GameKind,
  CpuDifficulty,
  GamePhase,
  GameState,
  HintsBudget,
  RandomPlayerHintsBudget,
  TeamController,
  TeamId,
} from '@/entities/game/core/types';

import { APP_VERSION } from '@/shared/config/version';

const STORAGE_KEY = 'footy-draft-game-state';

export type PersistedGamePayload = {
  version: number;
  state: GameState;
};

const TEAM_IDS: TeamId[] = ['team1', 'team2', 'team3', 'team4'];

function isHintsBudget(n: number): n is HintsBudget {
  return n === 0 || n === 1 || n === 2 || n === 3 || n === 11;
}

function isRandomPlayerHintsBudget(n: number): n is RandomPlayerHintsBudget {
  return n === 0 || n === 1 || n === 2 || n === 3 || n === 11;
}

function defaultHintsRemaining(budget: number): Record<TeamId, number> {
  return { team1: budget, team2: budget, team3: budget, team4: budget }
}

function defaultRandomPlayerHintsRemaining(budget: number): Record<TeamId, number> {
  return { team1: budget, team2: budget, team3: budget, team4: budget }
}

function normalizeMode(mode: unknown): GameMode {
  if (mode === 'clubs') return 'clubs'
  if (mode === 'rpl') return 'rpl'
  if (mode === 'chaos') return 'chaos'
  /** Старый «режим» нечестной игры перенесён в сложность CPU. */
  if (mode === 'unfair') return 'nationalTop30'
  if (mode === 'nationalTop15') return 'nationalTop15'
  if (mode === 'nationalTop30') return 'nationalTop30'
  if (mode === 'national') return 'nationalTop15'
  return 'nationalTop15'
}

function normalizeGameKind(kind: unknown): GameKind {
  if (kind === 'vsCpu') return 'vsCpu'
  if (kind === 'multi') return 'multi'
  return 'multi'
}

function normalizeCpuDifficulty(value: unknown): CpuDifficulty {
  if (value === 'beginner') return 'beginner'
  if (value === 'hard') return 'hard'
  if (value === 'unfair') return 'unfair'
  return 'normal'
}

function normalizeGameState(state: GameState): GameState {
  const legacy = state as GameState & {
    bestLineupHintUsed?: Record<TeamId, boolean>;
    hintsBudgetPerPlayer?: HintsBudget;
    hintsRemaining?: Record<TeamId, number>;
    hintUsedThisRound?: Record<TeamId, boolean>;
    bestLineupIncludeBench?: boolean;
    randomPlayerHintsBudgetPerPlayer?: RandomPlayerHintsBudget;
    randomPlayerHintsRemaining?: Record<TeamId, number>;
    randomPlayerHintError?: { team: TeamId; sourceLabel: string; position: string } | null;
    mode?: unknown;
    chaosDraftSourceKindsRemaining?: DraftSourceKind[];
    chaosDraftSourceKindsAll?: DraftSourceKind[];
    currentDraftSourceKind?: DraftSourceKind | null;
    gameKind?: unknown;
    cpuDifficulty?: unknown;
    cpuDifficultyByTeam?: unknown;
    teamControllers?: unknown;
  };

  const budget: HintsBudget = isHintsBudget(legacy.hintsBudgetPerPlayer ?? 0)
    ? legacy.hintsBudgetPerPlayer
    : 1

  let hintsRemaining = legacy.hintsRemaining
  if (!hintsRemaining) {
    if (legacy.bestLineupHintUsed) {
      hintsRemaining = {
        team1: legacy.bestLineupHintUsed.team1 ? 0 : 1,
        team2: legacy.bestLineupHintUsed.team2 ? 0 : 1,
        team3: legacy.bestLineupHintUsed.team3 ? 0 : 1,
        team4: legacy.bestLineupHintUsed.team4 ? 0 : 1,
      }
    } else {
      hintsRemaining = defaultHintsRemaining(budget)
    }
  }

  const hintUsedThisRound: Record<TeamId, boolean> = {
    team1: legacy.hintUsedThisRound?.team1 ?? false,
    team2: legacy.hintUsedThisRound?.team2 ?? false,
    team3: legacy.hintUsedThisRound?.team3 ?? false,
    team4: legacy.hintUsedThisRound?.team4 ?? false,
  }

  const rawLegacyMode = legacy.mode as unknown
  const mode = normalizeMode(legacy.mode ?? state.mode)
  const gameKind = normalizeGameKind(legacy.gameKind ?? state.gameKind)
  let legacyCpuSingle = normalizeCpuDifficulty(legacy.cpuDifficulty ?? 'normal')
  if (rawLegacyMode === 'unfair') {
    legacyCpuSingle = 'unfair'
  }

  const orderEarly =
    Array.isArray(legacy.teamOrder) && legacy.teamOrder.length >= 2
      ? (legacy.teamOrder as TeamId[])
      : state.teamOrder

  const normalizeController = (v: unknown): TeamController => (v === 'cpu' ? 'cpu' : 'human')
  const teamControllers: Record<TeamId, TeamController> = {
    team1: normalizeController((legacy.teamControllers as any)?.team1 ?? (state as any).teamControllers?.team1),
    team2: normalizeController((legacy.teamControllers as any)?.team2 ?? (state as any).teamControllers?.team2),
    team3: normalizeController((legacy.teamControllers as any)?.team3 ?? (state as any).teamControllers?.team3),
    team4: normalizeController((legacy.teamControllers as any)?.team4 ?? (state as any).teamControllers?.team4),
  }
  // Для старых сохранений vsCpu — гарантируем, что team2 это CPU.
  if (gameKind === 'vsCpu') {
    teamControllers.team1 = 'human'
    teamControllers.team2 = 'cpu'
  }

  const baseCpu: CpuDifficultyByTeam = {
    team1: 'normal',
    team2: 'normal',
    team3: 'normal',
    team4: 'normal',
  }
  const rawCpuMap = legacy.cpuDifficultyByTeam
  let cpuDifficultyByTeam: CpuDifficultyByTeam = { ...baseCpu }
  if (rawCpuMap && typeof rawCpuMap === 'object') {
    for (const id of TEAM_IDS) {
      if (id in (rawCpuMap as object)) {
        cpuDifficultyByTeam = {
          ...cpuDifficultyByTeam,
          [id]: normalizeCpuDifficulty((rawCpuMap as Record<string, unknown>)[id]),
        }
      }
    }
  } else {
    for (const id of TEAM_IDS) {
      const isCpu =
        gameKind === 'vsCpu' && orderEarly.length === 2
          ? id === 'team2'
          : teamControllers[id] === 'cpu'
      if (isCpu) {
        cpuDifficultyByTeam = { ...cpuDifficultyByTeam, [id]: legacyCpuSingle }
      }
    }
  }

  const randomBudget: RandomPlayerHintsBudget = isRandomPlayerHintsBudget(
    legacy.randomPlayerHintsBudgetPerPlayer ?? 0,
  )
    ? legacy.randomPlayerHintsBudgetPerPlayer
    : 1

  const randomPlayerHintsRemaining =
    legacy.randomPlayerHintsRemaining ?? defaultRandomPlayerHintsRemaining(randomBudget)

  const rawDraftTurnAcc = (legacy as { draftTurnAccumMs?: Record<TeamId, number> }).draftTurnAccumMs
  const draftTurnAccumMs: Record<TeamId, number> =
    rawDraftTurnAcc &&
    typeof rawDraftTurnAcc.team1 === 'number' &&
    typeof rawDraftTurnAcc.team2 === 'number' &&
    typeof rawDraftTurnAcc.team3 === 'number' &&
    typeof rawDraftTurnAcc.team4 === 'number'
      ? rawDraftTurnAcc
      : { team1: 0, team2: 0, team3: 0, team4: 0 }

  const merged: GameState = {
    ...state,
    mode,
    gameKind,
    cpuDifficultyByTeam,
    teamControllers,
    hintsBudgetPerPlayer: budget,
    hintsRemaining,
    hintUsedThisRound,
    randomPlayerHintsBudgetPerPlayer: randomBudget,
    randomPlayerHintsRemaining,
    randomPlayerHintError: legacy.randomPlayerHintError ?? null,
    chaosDraftSourceKindsRemaining: legacy.chaosDraftSourceKindsRemaining ?? [],
    chaosDraftSourceKindsAll: legacy.chaosDraftSourceKindsAll ?? [],
    currentDraftSourceKind: legacy.currentDraftSourceKind ?? null,
    // Старые сохранения могли не иметь playerStars в слотах.
    teams: Object.fromEntries(
      (Object.entries(state.teams) as Array<[TeamId, GameState['teams'][TeamId]]>).map(([teamId, team]) => {
        const nextPicks = Object.fromEntries(
          Object.entries(team.picksBySlotId).map(([slotId, pick]) => [
            slotId,
            {
              ...pick,
              playerStars: (pick as { playerStars?: unknown }).playerStars ?? null,
              pickedBy: (pick as { pickedBy?: unknown }).pickedBy ?? null,
            },
          ]),
        ) as GameState['teams'][TeamId]['picksBySlotId']
        const coachRaw = (team as { coach?: unknown }).coach
        let coach: GameState['teams'][TeamId]['coach'] = null
        if (
          coachRaw &&
          typeof coachRaw === 'object' &&
          typeof (coachRaw as { id?: unknown }).id === 'string' &&
          typeof (coachRaw as { name?: unknown }).name === 'string' &&
          typeof (coachRaw as { countryRu?: unknown }).countryRu === 'string' &&
          [2, 3, 4, 5].includes((coachRaw as { stars?: unknown }).stars as number)
        ) {
          const c = coachRaw as GameState['teams'][TeamId]['coach'] & {
            priorityFormation?: unknown
            strengthsRu?: unknown
            weaknessesRu?: unknown
          }
          const def = coachProfileFor(c.id)
          coach = {
            ...c,
            priorityFormation:
              typeof c.priorityFormation === 'string' && c.priorityFormation.length > 0
                ? c.priorityFormation
                : def.priorityFormation,
            strengthsRu:
              typeof c.strengthsRu === 'string' && c.strengthsRu.length > 0 ? c.strengthsRu : def.strengthsRu,
            weaknessesRu:
              typeof c.weaknessesRu === 'string' && c.weaknessesRu.length > 0
                ? c.weaknessesRu
                : def.weaknessesRu,
          }
        }
        return [teamId, { ...team, picksBySlotId: nextPicks, coach }]
      }),
    ) as GameState['teams'],
    draftTimerStartedAt: state.draftTimerStartedAt ?? null,
    draftTimerPausedAt: state.draftTimerPausedAt ?? null,
    draftTimerPausedAccumMs: state.draftTimerPausedAccumMs ?? 0,

    draftTurnAccumMs,
    draftTurnSliceStartedAt: null,
    coachDraft: (state as { coachDraft?: GameState['coachDraft'] }).coachDraft ?? null,
    formationPick: (state as { formationPick?: GameState['formationPick'] }).formationPick ?? null,
  }

  const hasTurnSliceKey = Object.prototype.hasOwnProperty.call(legacy, 'draftTurnSliceStartedAt')
  const draftTurnSliceStartedAt: number | null = hasTurnSliceKey
    ? ((legacy as { draftTurnSliceStartedAt: number | null }).draftTurnSliceStartedAt ?? null)
    : merged.phase === 'drafting' && merged.draftTimerPausedAt == null
      ? Date.now()
      : null

  const rawCd = merged.coachDraft
  const coachDraftNormalized: GameState['coachDraft'] = (() => {
    if (!rawCd) return null
    const cd = rawCd as GameState['coachDraft'] & {
      eliminationStepIndex?: number
      eliminationPickIndex?: number
      eliminationsCompleted?: number
    }
    const n = merged.teamOrder.length
    const total = 3 * n
    let eliminationStepIndex =
      typeof cd.eliminationStepIndex === 'number' && cd.eliminationStepIndex >= 0
        ? cd.eliminationStepIndex
        : 0
    if (typeof cd.eliminationStepIndex !== 'number' && cd.step === 'eliminate') {
      const ec = typeof cd.eliminationsCompleted === 'number' ? cd.eliminationsCompleted : 0
      const epi =
        typeof cd.eliminationPickIndex === 'number' && cd.eliminationPickIndex >= 0
          ? cd.eliminationPickIndex
          : 0
      eliminationStepIndex = Math.min(ec * 3 + Math.min(epi, 2), Math.max(0, total - 1))
    }
    let pending = cd.pendingEliminateIds
    if (pending.length > 1) pending = []
    return {
      step: cd.step,
      pools: cd.pools,
      eliminationStepIndex,
      activeIndex: typeof cd.activeIndex === 'number' ? cd.activeIndex : 0,
      pendingEliminateIds: pending,
    }
  })()

  return {
    ...merged,
    coachDraft: coachDraftNormalized,
    draftTurnSliceStartedAt,
    bestLineupIncludeBench: computeBestLineupIncludeBench(merged),
  }
}

function isValidGameState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const state = value as Record<string, unknown>;
  const phases: GamePhase[] = ['setup', 'coachDraft', 'formationPick', 'drawReveal', 'drafting', 'finished'];

  if (typeof state.phase !== 'string' || !phases.includes(state.phase as GamePhase)) {
    return false;
  }

  if (!Array.isArray(state.teamOrder) || state.teamOrder.length < 2) {
    return false;
  }

  if (!state.teams || typeof state.teams !== 'object') {
    return false;
  }

  const teams = state.teams as Record<string, unknown>;

  for (const id of TEAM_IDS) {
    if (!teams[id] || typeof teams[id] !== 'object') {
      return false;
    }
  }

  return true;
}

export function loadPersistedGameState(): GameState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PersistedGamePayload;

    if (parsed.version !== APP_VERSION || !parsed.state) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    if (!isValidGameState(parsed.state)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    const normalized = normalizeGameState(parsed.state);
    if (
      normalized.phase === 'setup' ||
      normalized.phase === 'drawReveal' ||
      normalized.phase === 'coachDraft' ||
      normalized.phase === 'formationPick'
    ) {
      return assignPlaceholderTeamNames(normalized);
    }
    return normalized;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveGameState(state: GameState): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const payload: PersistedGamePayload = {
      version: APP_VERSION,
      state,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // квота или приватный режим
  }
}

export function clearGameStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}
