import type { ColorSchemeId } from '@/entities/game/types';

/** Цвет кружка схемы (как на экране настройки команд). */
export function schemeDotColor(colorScheme: ColorSchemeId): string {
  switch (colorScheme) {
    case 'green':
      return 'rgba(38,145,80,0.95)';
    case 'red':
      return 'rgba(190,48,58,0.95)';
    case 'blue':
      return 'rgba(45,92,200,0.95)';
    case 'white':
      return 'rgba(240,240,245,0.95)';
    default:
      return 'rgba(255,255,255,0.9)';
  }
}

export function schemeAccent(colorScheme: ColorSchemeId): string {
  switch (colorScheme) {
    case 'green':
      return 'rgba(62, 185, 110, 0.95)';
    case 'red':
      return 'rgba(230, 72, 85, 0.95)';
    case 'blue':
      return 'rgba(96, 145, 255, 0.95)';
    case 'white':
      return 'rgba(230, 232, 240, 0.95)';
    default:
      return 'rgba(255, 255, 255, 0.85)';
  }
}
