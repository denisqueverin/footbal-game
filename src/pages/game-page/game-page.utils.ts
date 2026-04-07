import type { GameState } from '@/entities/game/types';

export function getDraftElapsedMs(state: GameState, now: number): number {
  if (!state.draftTimerStartedAt) {
    return 0;
  }

  if (state.draftTimerPausedAt != null) {
    return state.draftTimerPausedAt - state.draftTimerStartedAt - state.draftTimerPausedAccumMs;
  }

  return now - state.draftTimerStartedAt - state.draftTimerPausedAccumMs;
}

export function formatDraftDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
