export interface PhraseRevealState {
  index: number;
  opacity: number;
}

/** Одна фраза за раз: плавное появление и исчезновение внутри своего интервала. */
export function getPhraseRevealState(
  elapsedMs: number,
  phrases: readonly string[],
  totalMs: number,
): PhraseRevealState {
  const phraseCount = phrases.length;

  if (phraseCount === 0) {
    return { index: 0, opacity: 0 };
  }

  const segmentMs = totalMs / phraseCount;
  const index = Math.min(phraseCount - 1, Math.floor(elapsedMs / segmentMs));
  const localT = elapsedMs - index * segmentMs;
  const unit = segmentMs > 0 ? localT / segmentMs : 0;
  const fade = 0.14;
  let opacity = 1;

  if (unit < fade) {
    opacity = unit / fade;
  } else if (unit > 1 - fade) {
    opacity = Math.max(0, (1 - unit) / fade);
  }

  return { index, opacity };
}
