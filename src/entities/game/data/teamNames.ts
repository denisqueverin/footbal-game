import type { GameState, TeamId } from '../core/types'
import { isCpuControlledTeam } from '../modes/gameMode'

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

/** Базовое имя нейро-команды (в состоянии без префикса «Нейро »): оба слова со строчной буквы. */
export function randomNeuroTeamBaseLabel(): string {
  const noun = TEAM_NAME_NOUNS[Math.floor(Math.random() * TEAM_NAME_NOUNS.length)]!
  const adj = TEAM_NAME_ADJECTIVES[Math.floor(Math.random() * TEAM_NAME_ADJECTIVES.length)]!
  return `${adj.toLowerCase()} ${noun.toLowerCase()}`
}

/** После загрузки: подставить нейро-командам случайные имена (если не режим dev «вручную»). */
export function seedCpuNeuroBaseNames(state: GameState): GameState {
  if (state.devToolsEnabled && state.devNeuroTeamNameMode === 'manual') {
    return state
  }
  const order = state.teamOrder
  const used = new Set<string>()
  for (const tid of order) {
    used.add(state.teams[tid].name.trim().toLowerCase())
  }
  const nextTeams = { ...state.teams }
  for (const tid of order) {
    if (!isCpuControlledTeam(state, tid)) continue
    let label = ''
    let guard = 0
    while (guard++ < 4000) {
      label = randomNeuroTeamBaseLabel()
      if (!used.has(label.toLowerCase())) break
    }
    used.add(label.toLowerCase())
    nextTeams[tid] = { ...nextTeams[tid], name: label }
  }
  return { ...state, teams: nextTeams }
}

/** «Команда 1» … «Команда 4» — до конца сплеша жеребьёвки. */
export function assignPlaceholderTeamNames(state: GameState): GameState {
  const nextTeams = { ...state.teams }
  TEAM_IDS.forEach((id, i) => {
    nextTeams[id] = { ...nextTeams[id], name: `Команда ${i + 1}` }
  })
  return { ...state, teams: nextTeams }
}
