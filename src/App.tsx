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
        teamOrder={state.teamOrder}
        teams={state.teams}
        mode={state.mode}
        onSetTeamFormation={(team, formation) =>
          dispatch({ type: 'setup/setTeamFormation', team, formation })
        }
        onSetTeamName={(team, name) => dispatch({ type: 'setup/setTeamName', team, name })}
        onSetTeamColorScheme={(team, scheme) =>
          dispatch({ type: 'setup/setTeamColorScheme', team, scheme })
        }
        onSetTeamCount={(count) => dispatch({ type: 'setup/setTeamCount', count })}
        onSetMode={(mode) => dispatch({ type: 'setup/setMode', mode })}
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

