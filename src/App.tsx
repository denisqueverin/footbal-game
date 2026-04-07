import { useReducer } from 'react'
import { gameReducer, initialGameState } from './game/reducer'
import { SetupScreen } from './screens/SetupScreen'
import { GameScreen } from './screens/GameScreen'
import { ResultScreen } from './screens/ResultScreen'

export function App() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState)

  if (state.phase === 'setup') {
    return (
      <SetupScreen
        formationLocked={state.formationLocked}
        team1Formation={state.teams.team1.formation}
        team2Formation={state.teams.team2.formation}
        team3Formation={state.teams.team3.formation}
        team4Formation={state.teams.team4.formation}
        team1Name={state.teams.team1.name}
        team2Name={state.teams.team2.name}
        team3Name={state.teams.team3.name}
        team4Name={state.teams.team4.name}
        team1Color={state.teams.team1.color}
        team2Color={state.teams.team2.color}
        team3Color={state.teams.team3.color}
        team4Color={state.teams.team4.color}
        onSetTeamFormation={(team, formation) =>
          dispatch({ type: 'setup/setTeamFormation', team, formation })
        }
        onSetTeamName={(team, name) =>
          dispatch({ type: 'setup/setTeamName', team, name })
        }
        onSetTeamColor={(team, color) =>
          dispatch({ type: 'setup/setTeamColor', team, color })
        }
        onStart={() => dispatch({ type: 'setup/start' })}
      />
    )
  }

  if (state.phase === 'finished') {
    return <ResultScreen state={state} onReset={() => dispatch({ type: 'game/reset' })} />
  }

  return (
    <GameScreen
      state={state}
      onConfirmPick={(team, slotId, playerName) =>
        dispatch({ type: 'draft/confirmPick', team, slotId, playerName })
      }
      onReset={() => dispatch({ type: 'game/reset' })}
    />
  )
}

