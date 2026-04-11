import type { ColorSchemeId } from '@/entities/game/core/types';

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

/** Подпись цвета поля (как в настройках). */
export function schemeLabelRu(colorScheme: ColorSchemeId): string {
  switch (colorScheme) {
    case 'green':
      return 'Зелёная';
    case 'red':
      return 'Красная';
    case 'blue':
      return 'Синяя';
    case 'white':
      return 'Белая';
    default:
      return 'Команда';
  }
}

/** Короткая подпись для компактной схемы. */
export function schemeShortRu(colorScheme: ColorSchemeId): string {
  switch (colorScheme) {
    case 'green':
      return 'Зел';
    case 'red':
      return 'Крас';
    case 'blue':
      return 'Син';
    case 'white':
      return 'Бел';
    default:
      return '?';
  }
}

/** Фон панели команды на экране драфта тренеров. */
export function schemePanelBackground(colorScheme: ColorSchemeId): string {
  switch (colorScheme) {
    case 'green':
      return 'linear-gradient(180deg, rgba(38,145,80,0.22), rgba(0,0,0,0.14))';
    case 'red':
      return 'linear-gradient(180deg, rgba(190,48,58,0.2), rgba(0,0,0,0.14))';
    case 'blue':
      return 'linear-gradient(180deg, rgba(45,92,200,0.2), rgba(0,0,0,0.14))';
    case 'white':
      /* Тёмная «белая» панель: белый текст как у остальных схем */
      return 'linear-gradient(180deg, rgba(58, 64, 78, 0.92), rgba(24, 28, 36, 0.96))';
    default:
      return 'rgba(0,0,0,0.14)';
  }
}

/** Читаемый цвет текста на фоне панели цвета команды. */
export function schemePanelTextColor(_colorScheme: ColorSchemeId): string {
  return 'rgba(255, 255, 255, 0.94)';
}
