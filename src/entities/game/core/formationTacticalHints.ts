import type { FormationId } from './formations';

export type FormationTacticalHint = {
  schemeLabel: string;
  strengthsRu: string;
  weaknessesRu: string;
};

const HINTS: Partial<Record<FormationId, FormationTacticalHint>> = {
  '1-4-2-3-1': {
    schemeLabel: '4-2-3-1',
    strengthsRu:
      'Быстрая игра в одно-два касания в штрафной, автоматизированные забегания крайних защитников, техничная середина поля.',
    weaknessesRu:
      'Физическая хрупкость центра поля (недостаток чистых разрушителей), уязвимость на втором этаже и при быстрых контратаках соперника.',
  },
  '1-4-3-3': {
    schemeLabel: '4-3-3',
    strengthsRu:
      'Вертикализация атак (быстрая доставка мяча в штрафную без лишнего катания), создание изоляций 1-в-1 для вингеров.',
    weaknessesRu:
      'Проблемы в построении обороны при игре с высокой линией (частые разрывы между линиями), отсутствие плана Б при нейтрализации тройки нападения.',
  },
};

export function formationTacticalHint(id: FormationId): FormationTacticalHint | null {
  return HINTS[id] ?? null;
}
