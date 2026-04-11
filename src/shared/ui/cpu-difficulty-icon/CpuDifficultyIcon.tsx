import type { CpuDifficulty } from '@/entities/game/core/types';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

const LABEL_RU: Record<CpuDifficulty, string> = {
  beginner: 'Начинающий',
  normal: 'Нормальный',
  hard: 'Сложный',
  unfair: 'Нечестный',
};

/** Подпись уровня бота (подсказка / aria). */
export function cpuDifficultyLabelRu(difficulty: CpuDifficulty): string {
  return LABEL_RU[difficulty];
}

/** Эмодзи-иконки: начинающий 🔰, средний ⭐, сложный 👑; нечестный — ⚡ */
const EMOJI: Record<CpuDifficulty, string> = {
  beginner: '🔰',
  normal: '⭐',
  hard: '👑',
  unfair: '⚡',
};

export interface CpuDifficultyIconProps {
  difficulty: CpuDifficulty;
  className?: string;
}

export function CpuDifficultyIcon(props: CpuDifficultyIconProps) {
  const label = cpuDifficultyLabelRu(props.difficulty);
  return (
    <span
      className={cn('cpu-diff-icon', props.className)}
      title={label}
      aria-label={`Уровень бота: ${label}`}
      role="img"
    >
      <span aria-hidden="true">{EMOJI[props.difficulty]}</span>
    </span>
  );
}
