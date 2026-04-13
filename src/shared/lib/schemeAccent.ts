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
    case 'kitRedWhite':
      return 'rgba(200,16,46,0.95)';
    case 'kitBlueWhite':
      return 'rgba(30,77,139,0.95)';
    case 'kitMilan':
      return 'rgba(200,16,46,0.95)';
    case 'kitJuventus':
      return 'rgba(240,240,245,0.95)';
    case 'kitBarcelona':
      return 'rgba(0,77,152,0.95)';
    case 'kitRealMadrid':
      return 'rgba(212, 167, 58, 0.95)';
    case 'kitLiverpool':
      return 'rgba(200, 16, 46, 0.95)';
    case 'kitBrazil':
      return 'rgba(254, 210, 48, 0.95)';
    case 'kitNetherlands':
      return 'rgba(255, 102, 0, 0.95)';
    case 'kitPSG':
      return 'rgba(24, 48, 140, 0.95)';
    case 'kitArsenalCherry':
      return 'rgba(120, 22, 42, 0.95)';
    case 'kitLokomotiv':
      return 'rgba(210, 18, 24, 0.95)';
    case 'kitSynthwave':
      return 'rgba(236, 72, 153, 0.95)';
    case 'kitAcidTech':
      return 'rgba(200, 255, 60, 0.95)';
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
    case 'kitRedWhite':
      return 'rgba(232, 60, 80, 0.95)';
    case 'kitBlueWhite':
      return 'rgba(70, 130, 220, 0.95)';
    case 'kitMilan':
      return 'rgba(232, 60, 80, 0.95)';
    case 'kitJuventus':
      return 'rgba(210, 212, 220, 0.95)';
    case 'kitBarcelona':
      return 'rgba(80, 140, 255, 0.95)';
    case 'kitRealMadrid':
      return 'rgba(220, 175, 70, 0.95)';
    case 'kitLiverpool':
      return 'rgba(224, 52, 68, 0.95)';
    case 'kitBrazil':
      return 'rgba(0, 135, 95, 0.95)';
    case 'kitNetherlands':
      return 'rgba(255, 130, 40, 0.95)';
    case 'kitPSG':
      return 'rgba(100, 130, 255, 0.95)';
    case 'kitArsenalCherry':
      return 'rgba(200, 70, 100, 0.95)';
    case 'kitLokomotiv':
      return 'rgba(0, 140, 95, 0.95)';
    case 'kitSynthwave':
      return 'rgba(56, 189, 248, 0.95)';
    case 'kitAcidTech':
      return 'rgba(210, 255, 80, 0.95)';
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
    case 'kitRedWhite':
      return 'Красно-белая';
    case 'kitBlueWhite':
      return 'Синяя и белая';
    case 'kitMilan':
      return 'Красно-чёрная (Милан)';
    case 'kitJuventus':
      return 'Бело-чёрная (Ювентус)';
    case 'kitBarcelona':
      return 'Сине-гранатовая (Барселона)';
    case 'kitRealMadrid':
      return 'Белая с золотом (Реал Мадрид)';
    case 'kitLiverpool':
      return 'Красная (Ливерпуль)';
    case 'kitBrazil':
      return 'Жёлто-синяя (Бразилия)';
    case 'kitNetherlands':
      return 'Оранжевая (Нидерланды)';
    case 'kitPSG':
      return 'Сине-красная (ПСЖ)';
    case 'kitArsenalCherry':
      return 'Вишневая (Арсенал)';
    case 'kitLokomotiv':
      return 'Красно-зелёная (Локомотив)';
    case 'kitSynthwave':
      return 'Неоновая «синтвейв»';
    case 'kitAcidTech':
      return 'Кислотная «ночь»';
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
    case 'kitRedWhite':
      return 'К/б';
    case 'kitBlueWhite':
      return 'С/б';
    case 'kitMilan':
      return 'Мил';
    case 'kitJuventus':
      return 'Юве';
    case 'kitBarcelona':
      return 'Барс';
    case 'kitRealMadrid':
      return 'Реал';
    case 'kitLiverpool':
      return 'Лив';
    case 'kitBrazil':
      return 'Браз';
    case 'kitNetherlands':
      return 'Нид';
    case 'kitPSG':
      return 'ПСЖ';
    case 'kitArsenalCherry':
      return 'Арс';
    case 'kitLokomotiv':
      return 'Лок';
    case 'kitSynthwave':
      return 'Нео';
    case 'kitAcidTech':
      return 'Кис';
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
      return 'linear-gradient(180deg, rgba(58, 64, 78, 0.92), rgba(24, 28, 36, 0.96))';
    case 'kitRedWhite':
      return 'linear-gradient(180deg, rgba(200,16,46,0.22), rgba(0,0,0,0.14))';
    case 'kitBlueWhite':
      return 'linear-gradient(180deg, rgba(30,77,139,0.22), rgba(0,0,0,0.14))';
    case 'kitMilan':
      return 'linear-gradient(180deg, rgba(120,24,36,0.24), rgba(0,0,0,0.16))';
    case 'kitJuventus':
      return 'linear-gradient(180deg, rgba(58, 64, 78, 0.92), rgba(24, 28, 36, 0.96))';
    case 'kitBarcelona':
      return 'linear-gradient(180deg, rgba(0,77,152,0.22), rgba(90,0,50,0.12))';
    case 'kitRealMadrid':
      return 'linear-gradient(180deg, rgba(248,248,252,0.2), rgba(212,167,58,0.14))';
    case 'kitLiverpool':
      return 'linear-gradient(180deg, rgba(200,16,46,0.24), rgba(0,0,0,0.16))';
    case 'kitBrazil':
      return 'linear-gradient(180deg, rgba(254,210,48,0.22), rgba(0,60,140,0.18))';
    case 'kitNetherlands':
      return 'linear-gradient(180deg, rgba(255,120,20,0.24), rgba(0,0,0,0.14))';
    case 'kitPSG':
      return 'linear-gradient(180deg, rgba(24,48,120,0.26), rgba(160,20,40,0.12))';
    default:
      return 'rgba(0,0,0,0.14)';
  }
}

/** Читаемый цвет текста на фоне панели цвета команды. */
export function schemePanelTextColor(_colorScheme: ColorSchemeId): string {
  return 'rgba(255, 255, 255, 0.94)';
}

/**
 * CSS-переменные только для карточки поля команды (слоты, ввод, ✓) — в тон её форме.
 * Общий хром приложения не затрагивает.
 */
export function schemeTeamBoardKitVars(colorScheme: ColorSchemeId): Record<string, string> {
  const a = schemeAccent(colorScheme);
  switch (colorScheme) {
    case 'green':
      return {
        '--board-kit-accent': a,
        '--board-kit-accent-dim': 'rgba(62, 224, 143, 0.2)',
        '--board-kit-accent-ring': 'rgba(62, 224, 143, 0.38)',
        '--board-kit-confirm-top': 'rgba(62, 224, 143, 0.34)',
        '--board-kit-confirm-bottom': 'rgba(15, 61, 36, 0.78)',
        '--board-kit-border-soft': 'rgba(62, 224, 143, 0.24)',
      };
    case 'red':
      return {
        '--board-kit-accent': a,
        '--board-kit-accent-dim': 'rgba(230, 72, 85, 0.2)',
        '--board-kit-accent-ring': 'rgba(230, 72, 85, 0.38)',
        '--board-kit-confirm-top': 'rgba(230, 96, 108, 0.36)',
        '--board-kit-confirm-bottom': 'rgba(48, 14, 18, 0.82)',
        '--board-kit-border-soft': 'rgba(230, 72, 85, 0.26)',
      };
    case 'blue':
      return {
        '--board-kit-accent': a,
        '--board-kit-accent-dim': 'rgba(96, 145, 255, 0.2)',
        '--board-kit-accent-ring': 'rgba(96, 145, 255, 0.38)',
        '--board-kit-confirm-top': 'rgba(110, 155, 255, 0.34)',
        '--board-kit-confirm-bottom': 'rgba(18, 28, 58, 0.82)',
        '--board-kit-border-soft': 'rgba(96, 145, 255, 0.26)',
      };
    case 'white':
      return {
        '--board-kit-accent': a,
        '--board-kit-accent-dim': 'rgba(210, 212, 220, 0.16)',
        '--board-kit-accent-ring': 'rgba(210, 212, 220, 0.32)',
        '--board-kit-confirm-top': 'rgba(220, 224, 238, 0.28)',
        '--board-kit-confirm-bottom': 'rgba(28, 30, 38, 0.88)',
        '--board-kit-border-soft': 'rgba(200, 204, 220, 0.22)',
      };
    case 'kitRedWhite':
      return {
        '--board-kit-accent': a,
        '--board-kit-accent-dim': 'rgba(232, 60, 80, 0.2)',
        '--board-kit-accent-ring': 'rgba(232, 60, 80, 0.36)',
        '--board-kit-confirm-top': 'rgba(232, 70, 90, 0.36)',
        '--board-kit-confirm-bottom': 'rgba(52, 12, 20, 0.82)',
        '--board-kit-border-soft': 'rgba(232, 60, 80, 0.26)',
      };
    case 'kitBlueWhite':
      return {
        '--board-kit-accent': a,
        '--board-kit-accent-dim': 'rgba(70, 130, 220, 0.2)',
        '--board-kit-accent-ring': 'rgba(70, 130, 220, 0.36)',
        '--board-kit-confirm-top': 'rgba(80, 140, 230, 0.34)',
        '--board-kit-confirm-bottom': 'rgba(14, 28, 52, 0.82)',
        '--board-kit-border-soft': 'rgba(70, 130, 220, 0.26)',
      };
    case 'kitMilan':
      return {
        '--board-kit-accent': a,
        '--board-kit-accent-dim': 'rgba(232, 60, 80, 0.2)',
        '--board-kit-accent-ring': 'rgba(232, 60, 80, 0.36)',
        '--board-kit-confirm-top': 'rgba(200, 50, 70, 0.36)',
        '--board-kit-confirm-bottom': 'rgba(10, 8, 12, 0.88)',
        '--board-kit-border-soft': 'rgba(200, 40, 60, 0.28)',
      };
    case 'kitJuventus':
      return {
        '--board-kit-accent': a,
        '--board-kit-accent-dim': 'rgba(200, 204, 218, 0.14)',
        '--board-kit-accent-ring': 'rgba(200, 204, 218, 0.3)',
        '--board-kit-confirm-top': 'rgba(210, 214, 228, 0.26)',
        '--board-kit-confirm-bottom': 'rgba(18, 18, 22, 0.9)',
        '--board-kit-border-soft': 'rgba(180, 184, 200, 0.22)',
      };
    case 'kitBarcelona':
      return {
        '--board-kit-accent': a,
        '--board-kit-accent-dim': 'rgba(80, 140, 255, 0.2)',
        '--board-kit-accent-ring': 'rgba(80, 140, 255, 0.36)',
        '--board-kit-confirm-top': 'rgba(70, 130, 240, 0.34)',
        '--board-kit-confirm-bottom': 'rgba(40, 10, 40, 0.85)',
        '--board-kit-border-soft': 'rgba(100, 140, 220, 0.28)',
      };
    case 'kitRealMadrid':
      return {
        '--board-kit-accent': a,
        '--board-kit-accent-dim': 'rgba(220, 175, 70, 0.18)',
        '--board-kit-accent-ring': 'rgba(220, 175, 70, 0.34)',
        '--board-kit-confirm-top': 'rgba(230, 185, 85, 0.32)',
        '--board-kit-confirm-bottom': 'rgba(36, 32, 18, 0.88)',
        '--board-kit-border-soft': 'rgba(200, 165, 70, 0.28)',
      };
    case 'kitLiverpool':
      return {
        '--board-kit-accent': a,
        '--board-kit-accent-dim': 'rgba(224, 52, 68, 0.2)',
        '--board-kit-accent-ring': 'rgba(224, 52, 68, 0.36)',
        '--board-kit-confirm-top': 'rgba(230, 70, 85, 0.34)',
        '--board-kit-confirm-bottom': 'rgba(48, 10, 16, 0.86)',
        '--board-kit-border-soft': 'rgba(220, 50, 65, 0.26)',
      };
    case 'kitBrazil':
      return {
        '--board-kit-accent': a,
        '--board-kit-accent-dim': 'rgba(0, 155, 110, 0.18)',
        '--board-kit-accent-ring': 'rgba(0, 145, 100, 0.34)',
        '--board-kit-confirm-top': 'rgba(0, 165, 115, 0.3)',
        '--board-kit-confirm-bottom': 'rgba(0, 40, 70, 0.88)',
        '--board-kit-border-soft': 'rgba(0, 130, 95, 0.26)',
      };
    case 'kitNetherlands':
      return {
        '--board-kit-accent': a,
        '--board-kit-accent-dim': 'rgba(255, 130, 40, 0.2)',
        '--board-kit-accent-ring': 'rgba(255, 120, 35, 0.36)',
        '--board-kit-confirm-top': 'rgba(255, 140, 55, 0.32)',
        '--board-kit-confirm-bottom': 'rgba(48, 22, 8, 0.86)',
        '--board-kit-border-soft': 'rgba(255, 110, 30, 0.26)',
      };
    case 'kitPSG':
      return {
        '--board-kit-accent': a,
        '--board-kit-accent-dim': 'rgba(100, 130, 255, 0.2)',
        '--board-kit-accent-ring': 'rgba(100, 130, 255, 0.36)',
        '--board-kit-confirm-top': 'rgba(110, 140, 255, 0.32)',
        '--board-kit-confirm-bottom': 'rgba(20, 12, 48, 0.9)',
        '--board-kit-border-soft': 'rgba(90, 110, 220, 0.28)',
      };
    case 'kitArsenalCherry':
      return {
        '--board-kit-accent': a,
        '--board-kit-accent-dim': 'rgba(200, 70, 100, 0.2)',
        '--board-kit-accent-ring': 'rgba(190, 60, 90, 0.36)',
        '--board-kit-confirm-top': 'rgba(200, 80, 105, 0.34)',
        '--board-kit-confirm-bottom': 'rgba(36, 8, 14, 0.9)',
        '--board-kit-border-soft': 'rgba(180, 50, 75, 0.26)',
      };
    case 'kitLokomotiv':
      return {
        '--board-kit-accent': a,
        '--board-kit-accent-dim': 'rgba(0, 160, 110, 0.2)',
        '--board-kit-accent-ring': 'rgba(0, 150, 100, 0.36)',
        '--board-kit-confirm-top': 'rgba(0, 170, 115, 0.32)',
        '--board-kit-confirm-bottom': 'rgba(48, 8, 10, 0.88)',
        '--board-kit-border-soft': 'rgba(210, 30, 35, 0.22)',
      };
    case 'kitSynthwave':
      return {
        '--board-kit-accent': a,
        '--board-kit-accent-dim': 'rgba(56, 189, 248, 0.22)',
        '--board-kit-accent-ring': 'rgba(236, 72, 153, 0.38)',
        '--board-kit-confirm-top': 'rgba(56, 189, 248, 0.34)',
        '--board-kit-confirm-bottom': 'rgba(40, 12, 52, 0.9)',
        '--board-kit-border-soft': 'rgba(167, 139, 250, 0.28)',
      };
    case 'kitAcidTech':
      return {
        '--board-kit-accent': a,
        '--board-kit-accent-dim': 'rgba(200, 255, 70, 0.18)',
        '--board-kit-accent-ring': 'rgba(210, 255, 80, 0.4)',
        '--board-kit-confirm-top': 'rgba(210, 255, 90, 0.3)',
        '--board-kit-confirm-bottom': 'rgba(8, 10, 6, 0.92)',
        '--board-kit-border-soft': 'rgba(180, 255, 50, 0.24)',
      };
    default: {
      const ga = schemeAccent('green');
      return {
        '--board-kit-accent': ga,
        '--board-kit-accent-dim': 'rgba(62, 224, 143, 0.2)',
        '--board-kit-accent-ring': 'rgba(62, 224, 143, 0.38)',
        '--board-kit-confirm-top': 'rgba(62, 224, 143, 0.34)',
        '--board-kit-confirm-bottom': 'rgba(15, 61, 36, 0.78)',
        '--board-kit-border-soft': 'rgba(62, 224, 143, 0.24)',
      };
    }
  }
}
