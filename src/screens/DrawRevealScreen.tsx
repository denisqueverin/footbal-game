import { useEffect, useMemo, useRef, useState } from 'react'
import type { ColorSchemeId, GameState, TeamId } from '../game/types'
import { pickRandomLoadingPhrases } from '../game/loadingPhrases'
import { roundTurnOrder } from '../game/turnOrder'
import { APP_VERSION } from '../version'

type Props = {
  state: GameState
  onContinue: () => void
  onReset: () => void
}

const SPLASH_MS = 10_000

/** Одна фраза за раз: плавное появление и исчезновение внутри своего интервала. */
function phraseRevealState(
  elapsedMs: number,
  phrases: readonly string[],
  totalMs: number,
): { index: number; opacity: number } {
  const n = phrases.length
  if (n === 0) return { index: 0, opacity: 0 }
  const segmentMs = totalMs / n
  const idx = Math.min(n - 1, Math.floor(elapsedMs / segmentMs))
  const localT = elapsedMs - idx * segmentMs
  const u = segmentMs > 0 ? localT / segmentMs : 0
  const fade = 0.14
  let opacity = 1
  if (u < fade) opacity = u / fade
  else if (u > 1 - fade) opacity = Math.max(0, (1 - u) / fade)
  return { index: idx, opacity }
}

function schemeAccent(id: ColorSchemeId): string {
  switch (id) {
    case 'green':
      return 'rgba(62, 185, 110, 0.95)'
    case 'red':
      return 'rgba(230, 72, 85, 0.95)'
    case 'blue':
      return 'rgba(96, 145, 255, 0.95)'
    case 'white':
      return 'rgba(230, 232, 240, 0.95)'
    default:
      return 'rgba(255, 255, 255, 0.85)'
  }
}

export function DrawRevealScreen(props: Props) {
  const { state } = props
  const [elapsedMs, setElapsedMs] = useState(0)
  const ready = elapsedMs >= SPLASH_MS

  const round1Order = useMemo(
    () => roundTurnOrder(state.teamOrder, state.draftTurnOrderBase, 1),
    [state.teamOrder, state.draftTurnOrderBase],
  )

  const loadingPhrases = useMemo(() => pickRandomLoadingPhrases(), [])

  const rafRef = useRef(0)

  useEffect(() => {
    const t0 = performance.now()
    const tick = (now: number) => {
      const e = Math.min(SPLASH_MS, Math.max(0, now - t0))
      setElapsedMs(e)
      if (e < SPLASH_MS) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const progress = Math.min(1, elapsedMs / SPLASH_MS)

  const phraseState = useMemo(
    () => phraseRevealState(elapsedMs, loadingPhrases, SPLASH_MS),
    [elapsedMs, loadingPhrases],
  )
  const currentPhrase = loadingPhrases[phraseState.index] ?? ''

  return (
    <div className="draw-reveal">
      <div className="draw-reveal-stars" aria-hidden="true" />
      <div className="draw-reveal-inner">
        <div className="draw-reveal-version">v{APP_VERSION}</div>
        <div className="draw-reveal-badge">турнирная жеребьёвка</div>
        <h1 className="draw-reveal-title">Определение очерёдности ходов</h1>
        <p className="draw-reveal-lead">
          Случайным образом выбран порядок в первом раунде; в каждом следующем раунде первым ходит следующий игрок по
          кругу.
        </p>

        <div className="draw-reveal-stage" aria-live="polite">
          {!ready ? (
            <>
              <div className="draw-reveal-ball-wrap" aria-hidden="true">
                <div className="draw-reveal-ball" />
              </div>
              <div className="draw-reveal-progress">
                <div className="draw-reveal-progress-bar" style={{ transform: `scaleX(${progress})` }} />
              </div>
              <div className="draw-reveal-phrase-slot" aria-live="polite" aria-atomic="true">
                <p className="draw-reveal-phrase" style={{ opacity: phraseState.opacity }}>
                  {currentPhrase}
                </p>
              </div>
            </>
          ) : (
            <div className="draw-reveal-result">
              <div className="draw-reveal-result-title">Порядок в раунде 1</div>
              <ul className="draw-reveal-list">
                {round1Order.map((teamId, i) => (
                  <DrawRevealRow key={teamId} index={i + 1} teamId={teamId} state={state} />
                ))}
              </ul>
              <button type="button" className="draw-reveal-cta" onClick={props.onContinue}>
                Перейти к драфту
              </button>
            </div>
          )}
        </div>

        <div className="draw-reveal-footer">
          <button type="button" className="draw-reveal-ghost" onClick={props.onReset}>
            Новая игра
          </button>
        </div>
      </div>
    </div>
  )
}

function DrawRevealRow(props: { index: number; teamId: TeamId; state: GameState }) {
  const t = props.state.teams[props.teamId]
  const accent = schemeAccent(t.colorScheme)
  return (
    <li className="draw-reveal-li">
      <span className="draw-reveal-li-num" style={{ borderColor: accent, color: accent }}>
        {props.index}
      </span>
      <span className="draw-reveal-li-name">{t.name}</span>
    </li>
  )
}
