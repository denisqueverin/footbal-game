import { useEffect, useMemo, useRef, useState } from 'react';

import { pickRandomLoadingPhrases } from '@/entities/game/loadingPhrases';
import { roundTurnOrder } from '@/entities/game/turnOrder';
import type { GameState } from '@/entities/game/types';

import { APP_VERSION } from '@/shared/config/version';

import { getPhraseRevealState } from './draw-reveal-page.utils';
import { DrawRevealTeamRow } from './ui/DrawRevealTeamRow';

export interface DrawRevealPageProps {
  state: GameState;
  onContinue: () => void;
  onReset: () => void;
}

const SPLASH_MS = 10_000;

export function DrawRevealPage(props: DrawRevealPageProps) {
  const { state } = props;
  const [elapsedMs, setElapsedMs] = useState(0);
  const isReady = elapsedMs >= SPLASH_MS;

  const round1Order = useMemo(
    () => roundTurnOrder(state.teamOrder, state.draftTurnOrderBase, 1),
    [state.draftTurnOrderBase, state.teamOrder],
  );

  const loadingPhrases = useMemo(() => pickRandomLoadingPhrases(), []);

  const rafRef = useRef(0);

  useEffect(() => {
    const timeStart = performance.now();

    const tick = (now: number) => {
      const elapsed = Math.min(SPLASH_MS, Math.max(0, now - timeStart));
      setElapsedMs(elapsed);

      if (elapsed < SPLASH_MS) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const progress = Math.min(1, elapsedMs / SPLASH_MS);

  const phraseState = useMemo(
    () => getPhraseRevealState(elapsedMs, loadingPhrases, SPLASH_MS),
    [elapsedMs, loadingPhrases],
  );

  const currentPhrase = loadingPhrases[phraseState.index] ?? '';

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
          {!isReady ? (
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
          ) : null}

          {isReady ? (
            <div className="draw-reveal-result">
              <div className="draw-reveal-result-title">Порядок в раунде 1</div>
              <ul className="draw-reveal-list">
                {round1Order.map((teamId, index) => (
                  <DrawRevealTeamRow key={teamId} index={index + 1} teamId={teamId} state={state} />
                ))}
              </ul>
              <button type="button" className="draw-reveal-cta" onClick={props.onContinue}>
                Перейти к драфту
              </button>
            </div>
          ) : null}
        </div>

        <div className="draw-reveal-footer">
          <button type="button" className="draw-reveal-ghost" onClick={props.onReset}>
            Новая игра
          </button>
        </div>
      </div>
    </div>
  );
}
