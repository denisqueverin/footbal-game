// 5 most common modern formations
export type FormationId = '1-4-3-3' | '1-4-4-2' | '1-3-4-3' | '1-4-2-3-1' | '1-3-5-2'

export type FormationRow = ReadonlyArray<{
  slotId: string
  label: string
}>

export type FormationLayout = ReadonlyArray<FormationRow>

export const FORMATIONS: Record<
  FormationId,
  { name: FormationId; rows: FormationLayout }
> = {
  '1-4-3-3': {
    name: '1-4-3-3',
    rows: [
      [{ slotId: 'gk', label: 'GK' }],
      [
        { slotId: 'lb', label: 'LB' },
        { slotId: 'lcb', label: 'CB' },
        { slotId: 'rcb', label: 'CB' },
        { slotId: 'rb', label: 'RB' },
      ],
      [
        { slotId: 'cm1', label: 'CM' },
        { slotId: 'cm2', label: 'CM' },
        { slotId: 'cm3', label: 'CM' },
      ],
      [
        { slotId: 'lw', label: 'LW' },
        { slotId: 'st', label: 'ST' },
        { slotId: 'rw', label: 'RW' },
      ],
    ],
  },
  '1-4-4-2': {
    name: '1-4-4-2',
    rows: [
      [{ slotId: 'gk', label: 'GK' }],
      [
        { slotId: 'lb', label: 'LB' },
        { slotId: 'lcb', label: 'CB' },
        { slotId: 'rcb', label: 'CB' },
        { slotId: 'rb', label: 'RB' },
      ],
      [
        { slotId: 'lm', label: 'LM' },
        { slotId: 'cm1', label: 'CM' },
        { slotId: 'cm2', label: 'CM' },
        { slotId: 'rm', label: 'RM' },
      ],
      [
        { slotId: 'st1', label: 'ST' },
        { slotId: 'st2', label: 'ST' },
      ],
    ],
  },
  '1-3-4-3': {
    name: '1-3-4-3',
    rows: [
      [{ slotId: 'gk', label: 'GK' }],
      [
        { slotId: 'lcb', label: 'CB' },
        { slotId: 'cb', label: 'CB' },
        { slotId: 'rcb', label: 'CB' },
      ],
      [
        { slotId: 'lm', label: 'LM' },
        { slotId: 'cm1', label: 'CM' },
        { slotId: 'cm2', label: 'CM' },
        { slotId: 'rm', label: 'RM' },
      ],
      [
        { slotId: 'lw', label: 'LW' },
        { slotId: 'st', label: 'ST' },
        { slotId: 'rw', label: 'RW' },
      ],
    ],
  },
  '1-4-2-3-1': {
    name: '1-4-2-3-1',
    rows: [
      [{ slotId: 'gk', label: 'GK' }],
      [
        { slotId: 'lb', label: 'LB' },
        { slotId: 'lcb', label: 'CB' },
        { slotId: 'rcb', label: 'CB' },
        { slotId: 'rb', label: 'RB' },
      ],
      [
        { slotId: 'cdm1', label: 'CDM' },
        { slotId: 'cdm2', label: 'CDM' },
      ],
      [
        { slotId: 'lam', label: 'LAM' },
        { slotId: 'cam', label: 'CAM' },
        { slotId: 'ram', label: 'RAM' },
      ],
      [{ slotId: 'st', label: 'ST' }],
    ],
  },
  '1-3-5-2': {
    name: '1-3-5-2',
    rows: [
      [{ slotId: 'gk', label: 'GK' }],
      [
        { slotId: 'lcb', label: 'CB' },
        { slotId: 'cb', label: 'CB' },
        { slotId: 'rcb', label: 'CB' },
      ],
      [
        { slotId: 'lwb', label: 'LWB' },
        { slotId: 'cm1', label: 'CM' },
        { slotId: 'cm2', label: 'CM' },
        { slotId: 'cm3', label: 'CM' },
        { slotId: 'rwb', label: 'RWB' },
      ],
      [
        { slotId: 'st1', label: 'ST' },
        { slotId: 'st2', label: 'ST' },
      ],
    ],
  },
}

export function allSlotIds(formation: FormationId): string[] {
  const rows = FORMATIONS[formation].rows
  return rows.flatMap((r) => r.map((c) => c.slotId))
}

/** Ряды для отрисовки поля: нападающие сверху, вратарь снизу. */
export function formationRowsForDisplay(formation: FormationId): FormationRow[] {
  return [...FORMATIONS[formation].rows].reverse()
}

