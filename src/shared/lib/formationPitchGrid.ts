/** Максимум игроков в одной линии на поле — единая сетка для досок и превью схем. */
export const FORMATION_PITCH_TRACKS = 5;

/** 1-based индекс колонки CSS Grid для слота с центрированием линии из `rowLen` игроков. */
export function pitchSlotGridColumn(rowLen: number, indexInRow: number): number {
  const n = Math.min(rowLen, FORMATION_PITCH_TRACKS);
  const start = Math.floor((FORMATION_PITCH_TRACKS - n) / 2);
  return start + indexInRow + 1;
}
