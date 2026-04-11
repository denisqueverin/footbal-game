import { FORMATIONS, type FormationId } from './formations'
import { buildChaosDraftPool } from '../modes/chaosDraftPool'
import { supportsBestLineupHint } from '../modes/gameMode'
import { TOP_50_EURO_CLUBS } from '../data/topClubs'
import { RPL_CLUBS } from '../data/rplClubs'
import type {
  ColorSchemeId,
  DraftSourceKind,
  GameMode,
  GameState,
  CpuDifficulty,
  HintsBudget,
  RandomPlayerHintsBudget,
  SlotPick,
  TeamCount,
  TeamController,
  TeamId,
  TeamState,
} from './types'
import { areTeamNamesPlaceholder, assignRandomTeamNames } from '../data/teamNames'
import { drawRandom } from './random'
import {
  existingPickedPlayerNames,
  pickRandomEuroClubPlayer,
  pickRandomRplPlayer,
  pickRandomTop15Player,
  pickRandomTop30Player,
} from '../hints/randomPlayerHint'
import {
  TOP_15_FOOTBALL_COUNTRIES_RU,
  TOP_30_FOOTBALL_COUNTRIES_RU,
  pickRandomUnique,
} from '../data/topCountries'
import { roundTurnOrder } from './turnOrder'
import { withBestLineupBenchRule } from './bestLineupBenchRule'

export type GameAction =
  | { type: 'setup/start' }
  | { type: 'drawReveal/assignTeamNames' }
  | { type: 'drawReveal/continue' }
  | { type: 'setup/setMode'; mode: GameMode }
  | { type: 'setup/setCpuDifficulty'; difficulty: CpuDifficulty }
  | { type: 'setup/setTeamCount'; count: TeamCount }
  | { type: 'setup/setTeamController'; team: TeamId; controller: TeamController }
  | { type: 'setup/setTeamFormation'; team: TeamId; formation: FormationId }
  | { type: 'setup/setTeamColorScheme'; team: TeamId; scheme: ColorSchemeId }
  | { type: 'setup/setHintsBudget'; budget: HintsBudget }
  | { type: 'setup/setRandomPlayerHintsBudget'; budget: RandomPlayerHintsBudget }
  | { type: 'setup/applyDevPreset' }
  | {
      type: 'draft/confirmPick'
      team: TeamId
      slotId: string
      playerName: string
      playerStars?: 1 | 2 | 3 | 4 | 5 | null
      pickedBy?: 'human' | 'cpu' | null
    }
  | { type: 'draft/setDraftTimerPaused'; paused: boolean }
  | { type: 'draft/setPickPlayerName'; team: TeamId; slotId: string; playerName: string }
  | { type: 'draft/useBestLineupHint'; team: TeamId }
  | { type: 'draft/useRandomPlayerHint'; team: TeamId; slotId: string }
  | { type: 'draft/clearRandomPlayerHintError' }
  | { type: 'game/reset' }

const ALL_TEAMS: TeamId[] = ['team1', 'team2', 'team3', 'team4']

function teamOrderForCount(count: TeamCount): TeamId[] {
  if (count === 1) return ['team1', 'team2']
  return ALL_TEAMS.slice(0, count)
}

function nextTeamId(current: TeamId, order: TeamId[]): TeamId {
  const idx = order.indexOf(current)
  if (idx < 0) return order[0] ?? current
  return order[(idx + 1) % order.length] ?? current
}

function slotPickForFormationSlot(team: TeamState, slotId: string): SlotPick | null {
  for (const row of FORMATIONS[team.formation].rows) {
    for (const cell of row) {
      if (cell.slotId === slotId) {
        return {
          slotId: cell.slotId,
          label: cell.label,
          playerName: null,
          country: null,
          playerStars: null,
          pickedBy: null,
        }
      }
    }
  }
  return null
}

function createHintsRemaining(budget: number): Record<TeamId, number> {
  return { team1: budget, team2: budget, team3: budget, team4: budget }
}

function createRandomPlayerHintsRemaining(budget: number): Record<TeamId, number> {
  return { team1: budget, team2: budget, team3: budget, team4: budget }
}

function createHintUsedThisRound(): Record<TeamId, boolean> {
  return { team1: false, team2: false, team3: false, team4: false }
}

function defaultTeamControllers(): Record<TeamId, TeamController> {
  return { team1: 'human', team2: 'human', team3: 'human', team4: 'human' }
}

function makeEmptyTeam(
  team: TeamId,
  formation: FormationId,
  name: string,
  colorScheme: ColorSchemeId,
): TeamState {
  const picksBySlotId: Record<string, SlotPick> = {}
  for (const row of FORMATIONS[formation].rows) {
    for (const cell of row) {
      picksBySlotId[cell.slotId] = {
        slotId: cell.slotId,
        label: cell.label,
        playerName: null,
        country: null,
        playerStars: null,
        pickedBy: null,
      }
    }
  }
  return {
    id: team,
    name,
    formation,
    colorScheme,
    picksBySlotId,
  }
}

function isTeamFull(team: TeamState): boolean {
  return Object.values(team.picksBySlotId).every((p) => Boolean(p.playerName))
}

function allActiveTeamsFull(state: GameState): boolean {
  return state.teamOrder.every((id) => isTeamFull(state.teams[id]))
}

function drawNextCountry(state: GameState): GameState {
  if (state.roundIndex >= state.maxRounds) {
    return { ...state, currentCountry: null, currentDraftSourceKind: null }
  }
  if (state.countriesRemaining.length === 0) {
    return { ...state, currentCountry: null, currentDraftSourceKind: null }
  }

  if (state.mode === 'chaos') {
    const n = state.countriesRemaining.length
    const idx = Math.floor(Math.random() * n)
    const label = state.countriesRemaining[idx]!
    const kind = state.chaosDraftSourceKindsRemaining[idx]!
    const rest = state.countriesRemaining.filter((_, i) => i !== idx)
    const restKinds = state.chaosDraftSourceKindsRemaining.filter((_, i) => i !== idx)
    return {
      ...state,
      currentCountry: label,
      currentDraftSourceKind: kind,
      countriesRemaining: rest,
      chaosDraftSourceKindsRemaining: restKinds,
      roundIndex: state.roundIndex + 1,
      hintUsedThisRound: createHintUsedThisRound(),
    }
  }

  const { item, rest } = drawRandom(state.countriesRemaining)
  return {
    ...state,
    currentCountry: item,
    currentDraftSourceKind: null,
    countriesRemaining: rest,
    roundIndex: state.roundIndex + 1,
    hintUsedThisRound: createHintUsedThisRound(),
  }
}

export function createInitialGameState(): GameState {
  const base: GameState = {
    phase: 'setup',
    gameKind: 'multi',
    cpuDifficulty: 'normal',
    formationLocked: false,
    teamOrder: ['team1', 'team2'],
    mode: 'nationalTop15',
    teamControllers: defaultTeamControllers(),
    draftTurnOrderBase: 0,

    bestLineupIncludeBench: true,

    hintsBudgetPerPlayer: 1,
    hintsRemaining: createHintsRemaining(1),
    hintUsedThisRound: createHintUsedThisRound(),

    randomPlayerHintsBudgetPerPlayer: 1,
    randomPlayerHintsRemaining: createRandomPlayerHintsRemaining(1),
    randomPlayerHintError: null,

    countriesAll: [],
    countriesRemaining: [],
    chaosDraftSourceKindsRemaining: [],
    chaosDraftSourceKindsAll: [],
    currentCountry: null,
    currentDraftSourceKind: null,
    roundIndex: 0,
    maxRounds: 11,

    turn: 'team1',
    teams: {
      team1: makeEmptyTeam('team1', '1-4-3-3', 'Команда 1', 'green'),
      team2: makeEmptyTeam('team2', '1-4-3-3', 'Команда 2', 'red'),
      team3: makeEmptyTeam('team3', '1-4-3-3', 'Команда 3', 'blue'),
      team4: makeEmptyTeam('team4', '1-4-3-3', 'Команда 4', 'white'),
    },

    draftTimerStartedAt: null,
    draftTimerPausedAt: null,
    draftTimerPausedAccumMs: 0,
  }
  return withBestLineupBenchRule(base)
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'game/reset': {
      return createInitialGameState()
    }
    case 'setup/setMode': {
      if (state.phase !== 'setup') return state
      return { ...state, mode: action.mode }
    }
    case 'setup/setCpuDifficulty': {
      if (state.phase !== 'setup') return state
      return withBestLineupBenchRule({ ...state, cpuDifficulty: action.difficulty })
    }
    case 'setup/setTeamCount': {
      if (state.phase !== 'setup') return state
      const count = action.count
      if (count === 1) {
        const order: TeamId[] = ['team1', 'team2']
        return withBestLineupBenchRule({
          ...state,
          gameKind: 'vsCpu',
          teamOrder: order,
          turn: order[0] ?? 'team1',
          teamControllers: { ...state.teamControllers, team1: 'human', team2: 'cpu' },
        })
      }
      const nextOrder = teamOrderForCount(count)
      let teamControllers = state.teamControllers
      if (state.gameKind === 'vsCpu') {
        teamControllers = { ...state.teamControllers, team1: 'human', team2: 'human' }
      }
      return withBestLineupBenchRule({
        ...state,
        gameKind: 'multi',
        teamOrder: nextOrder,
        turn: nextOrder[0] ?? 'team1',
        teamControllers,
      })
    }
    case 'setup/setTeamController': {
      if (state.phase !== 'setup') return state
      // В режиме vs CPU контроллеры фиксированы.
      if (state.gameKind === 'vsCpu') return state
      // Первая команда всегда "человек" (чтобы была хоть одна управляемая вручную команда в UI).
      if (action.team === 'team1' && action.controller !== 'human') return state
      return withBestLineupBenchRule({
        ...state,
        teamControllers: {
          ...state.teamControllers,
          [action.team]: action.controller,
        },
      })
    }
    case 'setup/setTeamFormation': {
      if (state.formationLocked) return state
      if (state.phase !== 'setup') return state
      const formation = action.formation
      const team = action.team
      return {
        ...state,
        teams: {
          ...state.teams,
          [team]: makeEmptyTeam(team, formation, state.teams[team].name, state.teams[team].colorScheme),
        },
      }
    }
    case 'setup/setTeamColorScheme': {
      if (state.phase !== 'setup') return state
      return {
        ...state,
        teams: {
          ...state.teams,
          [action.team]: { ...state.teams[action.team], colorScheme: action.scheme },
        },
      }
    }
    case 'setup/setHintsBudget': {
      if (state.phase !== 'setup') return state
      return { ...state, hintsBudgetPerPlayer: action.budget }
    }
    case 'setup/setRandomPlayerHintsBudget': {
      if (state.phase !== 'setup') return state
      return { ...state, randomPlayerHintsBudgetPerPlayer: action.budget }
    }
    case 'setup/applyDevPreset': {
      if (state.phase !== 'setup') return state
      return withBestLineupBenchRule({
        ...state,
        hintsBudgetPerPlayer: 11,
        randomPlayerHintsBudgetPerPlayer: 11,
      })
    }
    case 'drawReveal/assignTeamNames': {
      if (state.phase !== 'drawReveal') return state
      if (!areTeamNamesPlaceholder(state)) return state
      return assignRandomTeamNames(state)
    }
    case 'setup/start': {
      const setupState = withBestLineupBenchRule(state)
      const isCpuTeam = (teamId: TeamId): boolean => {
        return setupState.gameKind === 'vsCpu'
          ? teamId === 'team2'
          : setupState.teamControllers[teamId] === 'cpu'
      }

      const chaosPicks =
        setupState.mode === 'chaos' ? pickRandomUnique(buildChaosDraftPool(), setupState.maxRounds) : null
      const items =
        chaosPicks != null
          ? chaosPicks.map((p) => p.label)
          : setupState.mode === 'rpl'
            ? pickRandomUnique(RPL_CLUBS, setupState.maxRounds)
            : setupState.mode === 'clubs'
              ? pickRandomUnique(TOP_50_EURO_CLUBS, setupState.maxRounds)
              : setupState.mode === 'nationalTop15'
                ? pickRandomUnique(TOP_15_FOOTBALL_COUNTRIES_RU, setupState.maxRounds)
                : pickRandomUnique(TOP_30_FOOTBALL_COUNTRIES_RU, setupState.maxRounds)
      const chaosKindsAll =
        chaosPicks != null ? chaosPicks.map((p) => p.kind) : ([] as GameState['chaosDraftSourceKindsAll'])
      const chaosKindsRemaining =
        chaosPicks != null ? [...chaosKindsAll] : ([] as GameState['chaosDraftSourceKindsRemaining'])
      const order: TeamId[] =
        setupState.teamOrder.length > 0 ? setupState.teamOrder : (['team1', 'team2'] as TeamId[])

      const n = order.length
      // В vsCPU оставляем прежнее поведение (CPU ходит вторым в раунде 1),
      // в остальных случаях — случайный стартовый сдвиг.
      const draftTurnOrderBase = setupState.gameKind === 'vsCpu' ? 0 : n > 0 ? Math.floor(Math.random() * n) : 0
      const hintBudget = setupState.hintsBudgetPerPlayer
      const randomPlayerHintBudget = setupState.randomPlayerHintsBudgetPerPlayer

      const nextTeams: GameState['teams'] = { ...setupState.teams }
      for (const teamId of order) {
        const prev = setupState.teams[teamId]
        // Компьютер выбирает схему случайно перед жеребьёвкой.
        const nextFormation =
          isCpuTeam(teamId)
            ? (Object.keys(FORMATIONS)[Math.floor(Math.random() * Object.keys(FORMATIONS).length)] as FormationId)
            : prev.formation
        // Имя команды назначается после сплеша жеребьёвки (drawReveal/assignTeamNames),
        // поэтому здесь оставляем плейсхолдеры.
        nextTeams[teamId] = makeEmptyTeam(teamId, nextFormation, prev.name, prev.colorScheme)
      }
      return {
        ...setupState,
        phase: 'drawReveal',
        formationLocked: true,
        draftTurnOrderBase,
        hintsRemaining: createHintsRemaining(hintBudget),
        hintUsedThisRound: createHintUsedThisRound(),
        randomPlayerHintsRemaining: createRandomPlayerHintsRemaining(
          setupState.mode === 'nationalTop15' ||
            setupState.mode === 'nationalTop30' ||
            setupState.mode === 'rpl' ||
            setupState.mode === 'clubs' ||
            setupState.mode === 'chaos'
            ? randomPlayerHintBudget
            : 0,
        ),
        randomPlayerHintError: null,
        countriesAll: items,
        countriesRemaining: items,
        chaosDraftSourceKindsAll: chaosKindsAll,
        chaosDraftSourceKindsRemaining: chaosKindsRemaining,
        currentCountry: null,
        currentDraftSourceKind: null,
        roundIndex: 0,
        turn: order[0] ?? 'team1',
        teams: nextTeams,
        draftTimerStartedAt: null,
        draftTimerPausedAt: null,
        draftTimerPausedAccumMs: 0,
      }
    }
    case 'drawReveal/continue': {
      if (state.phase !== 'drawReveal') return state
      const base: GameState = { ...state, phase: 'drafting' }
      const drawn = drawNextCountry(base)
      if (!drawn.currentCountry) {
        return { ...drawn, phase: 'finished' }
      }
      const first = roundTurnOrder(drawn.teamOrder, drawn.draftTurnOrderBase, drawn.roundIndex)[0]
      const startedAt = drawn.draftTimerStartedAt ?? Date.now()
      return {
        ...drawn,
        turn: first ?? drawn.turn,
        draftTimerStartedAt: startedAt,
        draftTimerPausedAt: null,
        draftTimerPausedAccumMs: drawn.draftTimerPausedAccumMs,
      }
    }
    case 'draft/setDraftTimerPaused': {
      if (state.phase !== 'drafting') return state
      if (action.paused) {
        if (state.draftTimerPausedAt != null) return state
        return { ...state, draftTimerPausedAt: Date.now() }
      }
      if (state.draftTimerPausedAt == null) return state
      const now = Date.now()
      const delta = now - state.draftTimerPausedAt
      return {
        ...state,
        draftTimerPausedAt: null,
        draftTimerPausedAccumMs: state.draftTimerPausedAccumMs + delta,
      }
    }
    case 'draft/useBestLineupHint': {
      if (state.phase !== 'drafting') return state
      if (!supportsBestLineupHint(state.mode)) return state
      if (state.hintsBudgetPerPlayer <= 0) return state
      if (!state.teamOrder.includes(action.team)) return state
      if (state.hintsRemaining[action.team] <= 0) return state
      if (state.hintUsedThisRound[action.team]) return state
      return {
        ...state,
        hintsRemaining: {
          ...state.hintsRemaining,
          [action.team]: state.hintsRemaining[action.team] - 1,
        },
        hintUsedThisRound: {
          ...state.hintUsedThisRound,
          [action.team]: true,
        },
      }
    }
    case 'draft/clearRandomPlayerHintError': {
      if (state.randomPlayerHintError == null) return state
      return { ...state, randomPlayerHintError: null }
    }
    case 'draft/setPickPlayerName': {
      if (state.phase !== 'drafting') return state
      const team = state.teams[action.team]
      let existing = team.picksBySlotId[action.slotId]
      if (!existing) {
        const created = slotPickForFormationSlot(team, action.slotId)
        if (!created) return state
        existing = created
      }

      const trimmed = action.playerName.trim()
      // Не сбрасываем country при пустом имени: при наборе текста имя временно пустое,
      // иначе клуб/страна драфта теряются до следующего сохранения.
      const nextPick: SlotPick =
        trimmed.length === 0
          ? { ...existing, playerName: null, country: existing.country }
          : { ...existing, playerName: trimmed, country: existing.country }

      const nextTeam: TeamState = {
        ...team,
        picksBySlotId: {
          ...team.picksBySlotId,
          [action.slotId]: nextPick,
        },
      }

      const nextState: GameState = {
        ...state,
        teams: { ...state.teams, [action.team]: nextTeam },
      }

      if (allActiveTeamsFull(nextState)) {
        return { ...nextState, phase: 'finished' }
      }

      return nextState
    }
    case 'draft/useRandomPlayerHint': {
      if (state.phase !== 'drafting') return state
      if (state.randomPlayerHintsBudgetPerPlayer <= 0) return state
      if (
        state.mode !== 'nationalTop15' &&
        state.mode !== 'nationalTop30' &&
        state.mode !== 'rpl' &&
        state.mode !== 'clubs' &&
        state.mode !== 'chaos'
      )
        return state
      if (state.turn !== action.team) return state
      if (!state.currentCountry) return state
      if (!state.teamOrder.includes(action.team)) return state

      const remaining = state.randomPlayerHintsRemaining[action.team] ?? 0
      if (remaining <= 0) return state

      const team = state.teams[action.team]
      const existing = team.picksBySlotId[action.slotId]
      if (!existing) return state
      if (existing.playerName) return state

      const position = existing.label
      const usedNames = existingPickedPlayerNames(state)
      const chaosKind: DraftSourceKind | null = state.mode === 'chaos' ? (state.currentDraftSourceKind ?? null) : null
      const effectiveMode: GameMode =
        state.mode === 'chaos'
          ? chaosKind === 'rplClub'
            ? 'rpl'
            : chaosKind === 'club'
              ? 'clubs'
              : 'nationalTop30'
          : state.mode

      const picked =
        effectiveMode === 'nationalTop15'
          ? pickRandomTop15Player({
              country: state.currentCountry,
              position,
              usedPlayerNames: usedNames,
            })
          : effectiveMode === 'nationalTop30'
            ? pickRandomTop30Player({
                country: state.currentCountry,
                position,
                usedPlayerNames: usedNames,
              })
            : effectiveMode === 'rpl'
              ? pickRandomRplPlayer({
                  club: state.currentCountry,
                  position,
                  usedPlayerNames: usedNames,
                })
              : pickRandomEuroClubPlayer({
                  club: state.currentCountry,
                  position,
                  usedPlayerNames: usedNames,
                })

      if (!picked) {
        return {
          ...state,
          randomPlayerHintsRemaining: {
            ...state.randomPlayerHintsRemaining,
            [action.team]: remaining - 1,
          },
          randomPlayerHintError: { team: action.team, sourceLabel: state.currentCountry, position },
        }
      }

      const nextTeam: TeamState = {
        ...team,
        picksBySlotId: {
          ...team.picksBySlotId,
          [action.slotId]: {
            ...existing,
            playerName: picked.playerName,
            country: state.currentCountry,
            playerStars: picked.stars,
            pickedBy: 'human',
          },
        },
      }

      const nextState: GameState = {
        ...state,
        formationLocked: true,
        randomPlayerHintsRemaining: {
          ...state.randomPlayerHintsRemaining,
          [action.team]: remaining - 1,
        },
        randomPlayerHintError: null,
        teams: { ...state.teams, [action.team]: nextTeam },
      }

      if (allActiveTeamsFull(nextState)) {
        return { ...nextState, phase: 'finished' }
      }

      const orderThisRound = roundTurnOrder(
        nextState.teamOrder,
        nextState.draftTurnOrderBase,
        nextState.roundIndex,
      )
      const nextTurn = nextTeamId(action.team, orderThisRound)
      const first = orderThisRound[0] ?? nextTurn
      if (nextTurn !== first) {
        return { ...nextState, turn: nextTurn }
      }

      // last team confirmed: advance to next item and back to first team of the new round
      const advanced = drawNextCountry({ ...nextState, turn: first })
      if (!advanced.currentCountry) {
        return { ...advanced, phase: 'finished' }
      }
      const firstNextRound = roundTurnOrder(
        advanced.teamOrder,
        advanced.draftTurnOrderBase,
        advanced.roundIndex,
      )[0]
      return { ...advanced, turn: firstNextRound ?? advanced.turn }
    }
    case 'draft/confirmPick': {
      if (state.phase !== 'drafting') return state
      if (state.turn !== action.team) return state
      if (!state.currentCountry) return state
      if (!state.teamOrder.includes(action.team)) return state

      const playerName = action.playerName.trim()
      if (playerName.length === 0) return state

      const team = state.teams[action.team]
      const existing = team.picksBySlotId[action.slotId]
      if (!existing) return state
      if (existing.playerName) return state

      const nextTeam: TeamState = {
        ...team,
        picksBySlotId: {
          ...team.picksBySlotId,
          [action.slotId]: {
            ...existing,
            playerName,
            country: state.currentCountry,
            playerStars: action.playerStars ?? null,
            pickedBy: action.pickedBy ?? 'human',
          },
        },
      }

      const nextState: GameState = {
        ...state,
        formationLocked: true,
        teams: { ...state.teams, [action.team]: nextTeam },
      }

      if (allActiveTeamsFull(nextState)) {
        return { ...nextState, phase: 'finished' }
      }

      const orderThisRound = roundTurnOrder(
        nextState.teamOrder,
        nextState.draftTurnOrderBase,
        nextState.roundIndex,
      )
      const nextTurn = nextTeamId(action.team, orderThisRound)
      const first = orderThisRound[0] ?? nextTurn
      if (nextTurn !== first) {
        return { ...nextState, turn: nextTurn }
      }

      // last team confirmed: advance to next item and back to first team of the new round
      const advanced = drawNextCountry({ ...nextState, turn: first })
      if (!advanced.currentCountry) {
        return { ...advanced, phase: 'finished' }
      }
      const firstNextRound = roundTurnOrder(
        advanced.teamOrder,
        advanced.draftTurnOrderBase,
        advanced.roundIndex,
      )[0]
      return { ...advanced, turn: firstNextRound ?? advanced.turn }
    }
    default:
      return state
  }
}

