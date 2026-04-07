import { assignPlaceholderTeamNames } from '@/entities/game/teamNames';
import type { GamePhase, GameState, TeamId } from '@/entities/game/types';

import { APP_VERSION } from '@/shared/config/version';

const STORAGE_KEY = 'footy-draft-game-state';

export type PersistedGamePayload = {
  version: number;
  state: GameState;
};

const TEAM_IDS: TeamId[] = ['team1', 'team2', 'team3', 'team4'];

function normalizeGameState(state: GameState): GameState {
  return {
    ...state,
    draftTimerStartedAt: state.draftTimerStartedAt ?? null,
    draftTimerPausedAt: state.draftTimerPausedAt ?? null,
    draftTimerPausedAccumMs: state.draftTimerPausedAccumMs ?? 0,
  };
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
