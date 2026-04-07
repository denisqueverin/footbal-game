import type { GameState, TeamId } from './types'

const TEAM_IDS: TeamId[] = ['team1', 'team2', 'team3', 'team4']

/** КТО / ЧТО — 30 шт. */
export const TEAM_NAME_NOUNS = [
  'Бутсы',
  'Гетры',
  'Щитки',
  'Судьи',
  'Лайнсмены',
  'Пенальти',
  'Офсайды',
  'Ауты',
  'Штанги',
  'Газоны',
  'Кроты',
  'Барсуки',
  'Ветераны',
  'Травмы',
  'Судороги',
  'Запасные',
  'Аутсайдеры',
  'Болельщики',
  'Фанаты',
  'Петарды',
  'Свистки',
  'Финты',
  'Подкаты',
  'Навесы',
  'Дриблёры',
  'Билеты',
  'Абонементы',
  'Комментаторы',
  'Повторы',
  'Протоколы',
] as const

/** КАКИЕ — 30 шт. */
export const TEAM_NAME_ADJECTIVES = [
  'Пьяные',
  'Ленивые',
  'Хромые',
  'Косые',
  'Вспотевшие',
  'Свирепые',
  'Бешеные',
  'Ржавые',
  'Дырявые',
  'Бюджетные',
  'Лишние',
  'Пластмассовые',
  'Хрустальные',
  'Эпические',
  'Случайные',
  'Беззубые',
  'Суетливые',
  'Уставшие',
  'Забытые',
  'Громкие',
  'Фальшивые',
  'Безнадёжные',
  'Тучные',
  'Заспанные',
  'Нервные',
  'Проданные',
  'Домашние',
  'Гостевые',
  'Мокрые',
  'Легендарные',
] as const

/** Прилагательное + существительное (существительное с маленькой буквы). */
function randomTeamLabel(): string {
  const noun = TEAM_NAME_NOUNS[Math.floor(Math.random() * TEAM_NAME_NOUNS.length)]!
  const adj = TEAM_NAME_ADJECTIVES[Math.floor(Math.random() * TEAM_NAME_ADJECTIVES.length)]!
  return `${adj} ${noun.toLowerCase()}`
}

function generateUniqueTeamNames(count: number): string[] {
  const used = new Set<string>()
  const out: string[] = []
  let guard = 0
  while (out.length < count && guard < 4000) {
    guard += 1
    const label = randomTeamLabel()
    if (!used.has(label)) {
      used.add(label)
      out.push(label)
    }
  }
  while (out.length < count) {
    out.push(`Команда ${out.length + 1}`)
  }
  return out
}

/** Плейсхолдеры до выдачи случайных имён после сплеша. */
export function areTeamNamesPlaceholder(state: GameState): boolean {
  return TEAM_IDS.every((id, i) => state.teams[id].name === `Команда ${i + 1}`)
}

/** «Команда 1» … «Команда 4» — до конца сплеша жеребьёвки. */
export function assignPlaceholderTeamNames(state: GameState): GameState {
  const nextTeams = { ...state.teams }
  TEAM_IDS.forEach((id, i) => {
    nextTeams[id] = { ...nextTeams[id], name: `Команда ${i + 1}` }
  })
  return { ...state, teams: nextTeams }
}

/** Случайные названия для всех четырёх слотов (уникальные пары). Вызывать после сплеша с мячом. */
export function assignRandomTeamNames(state: GameState): GameState {
  const names = generateUniqueTeamNames(4)
  const nextTeams = { ...state.teams }
  TEAM_IDS.forEach((id, i) => {
    nextTeams[id] = { ...nextTeams[id], name: names[i]! }
  })
  return { ...state, teams: nextTeams }
}
