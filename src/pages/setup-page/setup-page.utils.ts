import type { FormationId } from '@/entities/game/formations';

export function formationLabelShort(formationId: FormationId): string {
  return formationId.replace(/^1-/, '');
}
