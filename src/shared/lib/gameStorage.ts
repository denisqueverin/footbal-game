import { assignPlaceholderTeamNames } from '@/entities/game/teamNames';
import type { GameMode, GamePhase, GameState, HintsBudget, TeamId } from '@/entities/game/types';

import { APP_VERSION } from '@/shared/config/version';

const STORAGE_KEY = 'footy-draft-game-state';

export type PersistedGamePayload = {
  version: number;
  state: GameState;
};

const TEAM_IDS: TeamId[] = ['team1', 'team2', 'team3', 'team4'];

function isHintsBudget(n: number): n is HintsBudget {
  return n === 1 || n === 2 || n === 3;
}

function defaultHintsRemaining(budget: number): Record<TeamId, number> {
  return { team1: budget, team2: budget, team3: budget, team4: budget }
}

function normalizeMode(mode: unknown): GameMode {
  if (mode === 'clubs') return 'clubs'
  if (mode === 'nationalTop15') return 'nationalTop15'
  if (mode === 'nationalTop30') return 'nationalTop30'
  if (mode === 'national') return 'nationalTop30'
  return 'nationalTop30'
}

function normalizeGameState(state: GameState): GameState {
  const legacy = state as GameState & {
    bestLineupHintUsed?: Record<TeamId, boolean>;
    hintsBudgetPerPlayer?: HintsBudget;
    hintsRemaining?: Record<TeamId, number>;
    hintUsedThisRound?: Record<TeamId, boolean>;
    bestLineupIncludeBench?: boolean;
    mode?: unknown;
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

  return {
    ...state,
    mode,
    bestLineupIncludeBench,
    hintsBudgetPerPlayer: budget,
    hintsRemaining,
    hintUsedThisRound,
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
