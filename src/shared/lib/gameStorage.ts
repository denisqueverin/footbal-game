import { assignPlaceholderTeamNames } from '@/entities/game/data/teamNames';
import type {
  DraftSourceKind,
  GameMode,
  GameKind,
  CpuDifficulty,
  GamePhase,
  GameState,
  HintsBudget,
  RandomPlayerHintsBudget,
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
  return n === 0 || n === 1 || n === 2 || n === 3;
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

  const bestLineupIncludeBench =
    typeof legacy.bestLineupIncludeBench === 'boolean' ? legacy.bestLineupIncludeBench : true

  const mode = normalizeMode(legacy.mode ?? state.mode)
  const gameKind = normalizeGameKind(legacy.gameKind ?? state.gameKind)
  const cpuDifficulty = normalizeCpuDifficulty(legacy.cpuDifficulty ?? state.cpuDifficulty)

  const randomBudget: RandomPlayerHintsBudget = isRandomPlayerHintsBudget(
    legacy.randomPlayerHintsBudgetPerPlayer ?? 0,
  )
    ? legacy.randomPlayerHintsBudgetPerPlayer
    : 1

  const randomPlayerHintsRemaining =
    legacy.randomPlayerHintsRemaining ?? defaultRandomPlayerHintsRemaining(randomBudget)

  return {
    ...state,
    mode,
    gameKind,
    cpuDifficulty,
    bestLineupIncludeBench,
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
        return [teamId, { ...team, picksBySlotId: nextPicks }]
      }),
    ) as GameState['teams'],
    draftTimerStartedAt: state.draftTimerStartedAt ?? null,
    draftTimerPausedAt: state.draftTimerPausedAt ?? null,
    draftTimerPausedAccumMs: state.draftTimerPausedAccumMs ?? 0,
  }
}

function isValidGameState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const state = value as Record<string, unknown>;
  const phases: GamePhase[] = ['setup', 'drawReveal', 'drafting', 'finished'];

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
    if (normalized.phase === 'setup' || normalized.phase === 'drawReveal') {
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
