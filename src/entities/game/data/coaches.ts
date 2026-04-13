import { formationIdFromCoachPriorityLabel, randomFormationId, type FormationId } from '../core/formations'
import type {
  CoachAssignment,
  CoachStars,
  CpuDifficulty,
  GameKind,
  GameMode,
  TeamController,
  TeamId,
} from '../core/types'

import { coachProfileFor, type CoachProfileFields } from './coachProfiles'

type CoachBase = {
  id: string
  name: string
  /** Страна для флага (как в справочнике флагов). */
  countryRu: string
  stars: CoachStars
  /** Только в пуле при режиме РПЛ. */
  rplOnly: boolean
}

export type CoachRecord = CoachBase & CoachProfileFields

function toCoachAssignment(c: CoachRecord): CoachAssignment {
  return {
    id: c.id,
    name: c.name,
    countryRu: c.countryRu,
    stars: c.stars,
    priorityFormation: c.priorityFormation,
    strengthsRu: c.strengthsRu,
    weaknessesRu: c.weaknessesRu,
  }
}

const COACH_BASE = [
  // 5★
  { id: 'guardiola', name: 'Хосеп Гвардиола', countryRu: 'Испания', stars: 5, rplOnly: false },
  { id: 'ancelotti', name: 'Карло Анчелотти', countryRu: 'Италия', stars: 5, rplOnly: false },
  { id: 'mourinho', name: 'Жозе Моуринью', countryRu: 'Португалия', stars: 5, rplOnly: false },
  { id: 'ferguson', name: 'Сэр Алекс Фергюсон', countryRu: 'Шотландия', stars: 5, rplOnly: false },
  { id: 'zidane', name: 'Зинедин Зидан', countryRu: 'Франция', stars: 5, rplOnly: false },
  { id: 'klopp', name: 'Юрген Клопп', countryRu: 'Германия', stars: 5, rplOnly: false },
  { id: 'delbosque', name: 'Висенте дель Боске', countryRu: 'Испания', stars: 5, rplOnly: false },
  // 4★
  { id: 'simeone', name: 'Диего Симеоне', countryRu: 'Аргентина', stars: 4, rplOnly: false },
  { id: 'wenger', name: 'Арсен Венгер', countryRu: 'Франция', stars: 4, rplOnly: false },
  { id: 'conte', name: 'Антонио Конте', countryRu: 'Италия', stars: 4, rplOnly: false },
  { id: 'luisenrique', name: 'Луис Энрике', countryRu: 'Испания', stars: 4, rplOnly: false },
  { id: 'flick', name: 'Ханс-Дитер Флик', countryRu: 'Германия', stars: 4, rplOnly: false },
  { id: 'allegri', name: 'Массимилиано Аллегри', countryRu: 'Италия', stars: 4, rplOnly: false },
  { id: 'tuchel', name: 'Томас Тухель', countryRu: 'Германия', stars: 4, rplOnly: false },
  { id: 'mancini', name: 'Роберто Манчини', countryRu: 'Италия', stars: 4, rplOnly: false },
  { id: 'nagelsmann', name: 'Юлиан Нагельсманн', countryRu: 'Германия', stars: 4, rplOnly: false },
  { id: 'poch', name: 'Маурисио Почеттино', countryRu: 'Аргентина', stars: 4, rplOnly: false },
  { id: 'emery', name: 'Унаи Эмери', countryRu: 'Испания', stars: 4, rplOnly: false },
  { id: 'spalletti', name: 'Лучано Спаллетти', countryRu: 'Италия', stars: 4, rplOnly: true },
  { id: 'benitez', name: 'Рафаэль Бенитес', countryRu: 'Испания', stars: 4, rplOnly: false },
  { id: 'capello', name: 'Фабио Капелло', countryRu: 'Италия', stars: 4, rplOnly: true },
  { id: 'vangaal', name: 'Луи ван Гал', countryRu: 'Нидерланды', stars: 4, rplOnly: false },
  { id: 'gasperini', name: 'Джан Пьеро Гасперини', countryRu: 'Италия', stars: 4, rplOnly: false },
  { id: 'ranieri', name: 'Клаудио Раньери', countryRu: 'Италия', stars: 4, rplOnly: false },
  { id: 'advocaat', name: 'Дик Адвокат', countryRu: 'Нидерланды', stars: 4, rplOnly: true },
  { id: 'gazzaev', name: 'Валерий Газзаев', countryRu: 'Россия', stars: 4, rplOnly: true },
  // 3★
  { id: 'deschamps', name: 'Дидье Дешам', countryRu: 'Франция', stars: 3, rplOnly: false },
  { id: 'avb', name: 'Андре Виллаш-Боаш', countryRu: 'Португалия', stars: 3, rplOnly: true },
  { id: 'sampaoli', name: 'Жоржи Сампаоли', countryRu: 'Аргентина', stars: 3, rplOnly: false },
  { id: 'tite', name: 'Тите', countryRu: 'Бразилия', stars: 3, rplOnly: false },
  { id: 'koeman', name: 'Роналд Куман', countryRu: 'Нидерланды', stars: 3, rplOnly: false },
  { id: 'pioli', name: 'Стефано Пиоли', countryRu: 'Италия', stars: 3, rplOnly: false },
  { id: 'rodgers', name: 'Брендан Роджерс', countryRu: 'Северная Ирландия', stars: 3, rplOnly: false },
  { id: 'martinez', name: 'Роберто Мартинес', countryRu: 'Испания', stars: 3, rplOnly: false },
  { id: 'southgate', name: 'Гарет Саутгейт', countryRu: 'Англия', stars: 3, rplOnly: false },
  { id: 'lopetegui', name: 'Хулен Лопетеги', countryRu: 'Испания', stars: 3, rplOnly: false },
  { id: 'domenech', name: 'Раймон Доменек', countryRu: 'Франция', stars: 3, rplOnly: false },
  { id: 'vanbasten', name: 'Марко ван Бастен', countryRu: 'Нидерланды', stars: 3, rplOnly: false },
  { id: 'hiddink', name: 'Гус Хиддинк', countryRu: 'Нидерланды', stars: 3, rplOnly: true },
  { id: 'rehhagel', name: 'Отто Рехагель', countryRu: 'Германия', stars: 3, rplOnly: false },
  { id: 'lippi', name: 'Марсело Липпи', countryRu: 'Италия', stars: 3, rplOnly: false },
  { id: 'scolari', name: 'Луис Фелипе Сколари', countryRu: 'Бразилия', stars: 3, rplOnly: false },
  { id: 'semin', name: 'Юрий Сёмин', countryRu: 'Россия', stars: 3, rplOnly: true },
  { id: 'berdyev', name: 'Курбан Бердыев', countryRu: 'Россия', stars: 3, rplOnly: true },
  { id: 'romantsev', name: 'Олег Романцев', countryRu: 'Россия', stars: 3, rplOnly: true },
  { id: 'slutsky', name: 'Леонид Слуцкий', countryRu: 'Россия', stars: 3, rplOnly: true },
  { id: 'luce', name: 'Мирча Луческу', countryRu: 'Румыния', stars: 3, rplOnly: true },
  { id: 'karpin', name: 'Валерий Карпин', countryRu: 'Россия', stars: 3, rplOnly: true },
  { id: 'cherchesov', name: 'Станислав Черчесов', countryRu: 'Россия', stars: 3, rplOnly: true },
  { id: 'semak', name: 'Сергей Семак', countryRu: 'Россия', stars: 3, rplOnly: true },
  // 2★
  { id: 'yartsev', name: 'Георгий Ярцев', countryRu: 'Россия', stars: 2, rplOnly: true },
  { id: 'morozov', name: 'Юрий Морозов', countryRu: 'Россия', stars: 2, rplOnly: true },
  { id: 'byshovets', name: 'Анатолий Бышовец', countryRu: 'Россия', stars: 2, rplOnly: true },
  { id: 'fedotov', name: 'Владимир Федотов', countryRu: 'Россия', stars: 2, rplOnly: true },
  { id: 'gadzhiev', name: 'Гаджи Гаджиев', countryRu: 'Россия', stars: 2, rplOnly: true },
  { id: 'bozovic', name: 'Миодраг Божович', countryRu: 'Черногория', stars: 2, rplOnly: true },
  { id: 'krasnozh', name: 'Юрий Красножан', countryRu: 'Россия', stars: 2, rplOnly: true },
  { id: 'kobelev', name: 'Андрей Кобелев', countryRu: 'Россия', stars: 2, rplOnly: true },
] as const satisfies readonly CoachBase[]

/** Полный список тренеров (звёзды по заданию + тактический профиль). */
export const ALL_COACHES: readonly CoachRecord[] = COACH_BASE.map((c) => ({
  ...c,
  ...coachProfileFor(c.id),
}))

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
}

export function coachesPoolForMode(mode: GameMode): CoachRecord[] {
  if (mode === 'rpl') return ALL_COACHES.filter((c) => c.rplOnly)
  return ALL_COACHES.filter((c) => !c.rplOnly)
}

function pickShuffled<T>(records: readonly T[], n: number): T[] {
  const copy = [...records]
  shuffleInPlace(copy)
  return copy.slice(0, Math.max(0, Math.min(n, copy.length)))
}

/** Пять тренеров по правилам drawCoachPoolOf5 из переданного списка (уже отфильтрованного). */
function pickFiveCoachRecordsFromList(copy: CoachRecord[]): CoachRecord[] {
  shuffleInPlace(copy)
  const fiveStars = copy.filter((c) => c.stars === 5)
  const rest = copy.filter((c) => c.stars !== 5)
  const wantTwo = fiveStars.length >= 2 && Math.random() < 0.5
  const take5 = Math.min(wantTwo ? 2 : 1, fiveStars.length)
  const out: CoachRecord[] = [...fiveStars.slice(0, take5)]
  const tail = [...fiveStars.slice(take5), ...rest]
  shuffleInPlace(tail)
  while (out.length < 5 && tail.length > 0) {
    out.push(tail.shift()!)
  }
  shuffleInPlace(out)
  return out
}

/** 1–2 пятизвёздочных (минимум один), остальное — случайно из пула. */
export function drawCoachPoolOf5(mode: GameMode): CoachAssignment[] {
  const pool = coachesPoolForMode(mode)
  if (pool.length < 5) {
    const fallback = [...ALL_COACHES]
    shuffleInPlace(fallback)
    return fallback.slice(0, 5).map((c) => toCoachAssignment(c))
  }
  return pickFiveCoachRecordsFromList([...pool]).map((c) => toCoachAssignment(c))
}

/**
 * Пул из пяти для CPU в режиме «Сложный»: три тренера 5★ и два 4★ (если в пуле режима
 * не хватает пятизвёздочных — добираем из остальных по убыванию «звёздности» после случайного тасования).
 */
function pickHardCpuFiveFromRecordList(pool: CoachRecord[]): CoachRecord[] {
  if (pool.length < 5) {
    const copy = [...pool]
    shuffleInPlace(copy)
    return copy.slice(0, 5)
  }
  const fiveStar = pool.filter((c) => c.stars === 5)
  const fourStar = pool.filter((c) => c.stars === 4)
  const picked: CoachRecord[] = []
  picked.push(...pickShuffled(fiveStar, Math.min(3, fiveStar.length)))
  const used = new Set(picked.map((p) => p.id))
  const fourAvail = fourStar.filter((c) => !used.has(c.id))
  picked.push(...pickShuffled(fourAvail, Math.min(2, fourAvail.length, 5 - picked.length)))
  const remainder = pool.filter((c) => !picked.some((p) => p.id === c.id))
  shuffleInPlace(remainder)
  while (picked.length < 5 && remainder.length > 0) {
    picked.push(remainder.shift()!)
  }
  shuffleInPlace(picked)
  return picked
}

export function drawCoachPoolHardCpu(mode: GameMode): CoachAssignment[] {
  const pool = coachesPoolForMode(mode)
  if (pool.length < 5) {
    return drawCoachPoolOf5(mode)
  }
  return pickHardCpuFiveFromRecordList(pool).map((c) => toCoachAssignment(c))
}

export type CoachPoolsDraftContext = {
  gameKind: GameKind
  cpuDifficultyByTeam: Record<TeamId, CpuDifficulty>
  teamControllers: Record<TeamId, TeamController>
}

function isCpuTeamDraft(teamId: TeamId, ctx: CoachPoolsDraftContext, order: TeamId[]): boolean {
  if (ctx.gameKind === 'vsCpu' && order.length === 2) return teamId === 'team2'
  return ctx.teamControllers[teamId] === 'cpu'
}

function recordsPoolWideEnough(mode: GameMode, need: number): CoachRecord[] {
  const pool = coachesPoolForMode(mode)
  if (pool.length >= need) return pool
  return ALL_COACHES.filter((c) => (mode === 'rpl' ? c.rplOnly : !c.rplOnly))
}

function drawFiveDisjoint(mode: GameMode, used: Set<string>): CoachAssignment[] {
  const pool = recordsPoolWideEnough(mode, 5).filter((c) => !used.has(c.id))
  if (pool.length < 5) {
    const fb = ALL_COACHES.filter((c) => (mode === 'rpl' ? c.rplOnly : !c.rplOnly)).filter(
      (c) => !used.has(c.id),
    )
    shuffleInPlace(fb)
    return fb.slice(0, 5).map((c) => toCoachAssignment(c))
  }
  return pickFiveCoachRecordsFromList([...pool]).map((c) => toCoachAssignment(c))
}

function drawHardCpuFiveDisjoint(mode: GameMode, used: Set<string>, needSlots: number): CoachAssignment[] {
  const pool = recordsPoolWideEnough(mode, needSlots).filter((c) => !used.has(c.id))
  if (pool.length < 5) return drawFiveDisjoint(mode, used)
  return pickHardCpuFiveFromRecordList(pool).map((c) => toCoachAssignment(c))
}

/** Раунд-робин: раздать тренеров звёздности `stars` по CPU-пулам, у каждого &lt; 5. */
function assignStarTierRoundRobinCpu(
  cpuOrder: TeamId[],
  pools: Record<TeamId, CoachAssignment[]>,
  allRecords: CoachRecord[],
  used: Set<string>,
  stars: CoachStars,
): void {
  const tier = allRecords.filter((c) => !used.has(c.id) && c.stars === stars)
  shuffleInPlace(tier)
  let rr = 0
  for (const c of tier) {
    if (cpuOrder.every((t) => pools[t].length >= 5)) break
    let placed = false
    for (let k = 0; k < cpuOrder.length; k++) {
      const tid = cpuOrder[(rr + k) % cpuOrder.length]!
      if (pools[tid].length < 5) {
        pools[tid].push(toCoachAssignment(c))
        used.add(c.id)
        rr = (cpuOrder.indexOf(tid) + 1) % cpuOrder.length
        placed = true
        break
      }
    }
    if (!placed) break
  }
}

function fillCpuPoolsToFive(
  cpuOrder: TeamId[],
  pools: Record<TeamId, CoachAssignment[]>,
  allRecords: CoachRecord[],
  used: Set<string>,
): void {
  const rest = allRecords.filter((c) => !used.has(c.id))
  shuffleInPlace(rest)
  let rr = 0
  for (const c of rest) {
    if (cpuOrder.every((t) => pools[t].length >= 5)) break
    for (let k = 0; k < cpuOrder.length; k++) {
      const tid = cpuOrder[(rr + k) % cpuOrder.length]!
      if (pools[tid].length < 5) {
        pools[tid].push(toCoachAssignment(c))
        used.add(c.id)
        rr = (cpuOrder.indexOf(tid) + 1) % cpuOrder.length
        break
      }
    }
  }
}

/**
 * Пулы тренеров без повторов между командами.
 * Если ровно один человек и три CPU — у CPU сначала равномерно 5★, затем 4★, затем добор до 5.
 */
export function buildCoachPoolsForDraft(
  order: TeamId[],
  mode: GameMode,
  ctx: CoachPoolsDraftContext,
): Record<TeamId, CoachAssignment[]> {
  const n = order.length
  const used = new Set<string>()
  const pools = {} as Record<TeamId, CoachAssignment[]>

  const humanTeams = order.filter((t) => !isCpuTeamDraft(t, ctx, order))
  const cpuTeams = order.filter((t) => isCpuTeamDraft(t, ctx, order))

  if (humanTeams.length === 1 && cpuTeams.length === 3) {
    const humanId = humanTeams[0]!
    const humanFive = drawFiveDisjoint(mode, used)
    pools[humanId] = humanFive
    humanFive.forEach((c) => used.add(c.id))

    const allRecords = recordsPoolWideEnough(mode, 5 * n)
    for (const t of cpuTeams) pools[t] = []

    assignStarTierRoundRobinCpu(cpuTeams, pools, allRecords, used, 5)
    assignStarTierRoundRobinCpu(cpuTeams, pools, allRecords, used, 4)
    fillCpuPoolsToFive(cpuTeams, pools, allRecords, used)
    return pools
  }

  for (const teamId of order) {
    const preferHard =
      ctx.cpuDifficultyByTeam[teamId] === 'hard' && isCpuTeamDraft(teamId, ctx, order)
    const five = preferHard
      ? drawHardCpuFiveDisjoint(mode, used, 5 * n)
      : drawFiveDisjoint(mode, used)
    five.forEach((c) => used.add(c.id))
    pools[teamId] = five
  }
  return pools
}

/** Кого убрать у соперника — стратегия зависит от сложности CPU. */
export function pickCpuEliminateCoachIds(
  pool: readonly CoachAssignment[],
  difficulty: CpuDifficulty,
): string[] {
  const copy = [...pool]
  if (difficulty === 'beginner') {
    shuffleInPlace(copy)
    return copy.slice(0, 3).map((c) => c.id)
  }
  if (difficulty === 'hard' || difficulty === 'unfair') {
    copy.sort((a, b) => b.stars - a.stars || a.id.localeCompare(b.id))
    return copy.slice(0, 3).map((c) => c.id)
  }
  // normal: убираем слабых и «средних» — троих с наименьшими звёздами
  copy.sort((a, b) => {
    if (a.stars !== b.stars) return a.stars - b.stars
    return Math.random() - 0.5
  })
  return copy.slice(0, 3).map((c) => c.id)
}

/** Одно снятие за ход: пересчитываем стратегию по оставшемуся пулу. */
export function pickCpuEliminateOneCoachId(
  pool: readonly CoachAssignment[],
  difficulty: CpuDifficulty,
): string {
  const ids = pickCpuEliminateCoachIds(pool, difficulty)
  return ids[0]!
}

/** Финальный выбор тренера для CPU. */
export function pickCpuFinalCoachId(pool: readonly CoachAssignment[], difficulty: CpuDifficulty): string {
  if (difficulty === 'beginner') {
    return pool[Math.floor(Math.random() * pool.length)]!.id
  }
  const sorted = [...pool].sort((a, b) => b.stars - a.stars || a.id.localeCompare(b.id))
  return sorted[0]!.id
}

export const COACH_SIMULATION_PROMPT_EXTRA =
  'Учитывай силу и тактические фишки тренера при симуляции чемпионата.'

/** Дополнительная строка к промпту симуляции (капитаны команд). */
export const CAPTAIN_SIMULATION_PROMPT_LINE = 'Учти влияние капитана команды.'

/** Схема поля для CPU после драфта тренеров: только в «сложном» — приоритет тренера, иначе случайно. */
export function pickCpuFormationForCoach(
  coach: CoachAssignment | null,
  difficulty: CpuDifficulty,
): FormationId {
  if (difficulty !== 'hard') {
    return randomFormationId()
  }
  const preferred = coach ? formationIdFromCoachPriorityLabel(coach.priorityFormation) : null
  if (preferred != null) {
    return preferred
  }
  return randomFormationId()
}
