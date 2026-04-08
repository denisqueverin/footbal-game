import type { FormationId } from '@/entities/game/core/formations';

export function formationLabelShort(formationId: FormationId): string {
  return formationId.replace(/^1-/, '');
}
