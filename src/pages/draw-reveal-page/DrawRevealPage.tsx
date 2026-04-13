import { useEffect, useMemo, useRef, useState } from 'react';

import { pickRandomLoadingPhrases } from '@/entities/game/data/loadingPhrases';
import { getClubFlagUrl } from '@/entities/game/data/clubCountries';
import { getCountryFlagUrlRu } from '@/entities/game/data/topCountries';
import { roundTurnOrder } from '@/entities/game/core/turnOrder';
import type { ColorSchemeId, DraftSourceKind, GameMode, GameState, TeamId } from '@/entities/game/core/types';
import { canAdvanceFromDrawRevealIdentity } from '@/entities/game/core/drawRevealIdentity';

import { APP_VERSION } from '@/shared/config/version';
import { ConfirmNewGameModal } from '@/shared/ui/confirm-new-game-modal';

import { getPhraseRevealState } from './draw-reveal-page.utils';
import { DrawRevealTeamIdentitySection } from './ui/DrawRevealTeamIdentitySection';
import { DrawRevealTeamRow } from './ui/DrawRevealTeamRow';

export interface DrawRevealPageProps {
  state: GameState;
  onSetTeamName: (team: TeamId, name: string) => void;
  onSetTeamColorScheme: (team: TeamId, scheme: ColorSchemeId) => void;
  onSeedCpuTeamNames: () => void;
  onContinue: () => void;
  onReset: () => void;
  /** Текст кнопки после жеребьёвки (по умолчанию — переход к драфту игроков). */
  continueButtonLabel?: string;
}

const SPLASH_MS_DEFAULT = 10_000;
/** В режиме разработки (чекбокс при старте) — короче ждать перед экраном жеребьёвки. */
const SPLASH_MS_DEV_TOOLS = 5_000;

function loadingFlagUrlForLabel(
  label: string,
  mode: GameMode,
  chaosKind: DraftSourceKind | undefined,
): string | null {
  if (mode === 'nationalTop15' || mode === 'nationalTop30') {
    return getCountryFlagUrlRu(label);
  }
  if (mode === 'clubs' || mode === 'rpl') {
    return getClubFlagUrl(label);
  }
  if (mode === 'chaos') {
    if (chaosKind === 'national') {
      return getCountryFlagUrlRu(label);
    }
    return getClubFlagUrl(label);
  }
  return null;
}

export function DrawRevealPage(props: DrawRevealPageProps) {
  const { state } = props;
  const splashMs = state.devToolsEnabled ? SPLASH_MS_DEV_TOOLS : SPLASH_MS_DEFAULT;
  const [elapsedMs, setElapsedMs] = useState(0);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const isReady = elapsedMs >= splashMs;
  const seedDoneRef = useRef(false);

  const round1Order = useMemo(
    () => roundTurnOrder(state.teamOrder, state.draftTurnOrderBase, 1),
    [state.draftTurnOrderBase, state.teamOrder],
  );

  const loadingPhrases = useMemo(() => pickRandomLoadingPhrases(), []);

  const loadingFlagItems = useMemo(() => {
    const labels = state.countriesAll;
    const kinds = state.chaosDraftSourceKindsAll;
    const { mode } = state;
    return labels
      .map((label, i) => {
        const chaosKind = mode === 'chaos' ? kinds[i] : undefined;
        const url = loadingFlagUrlForLabel(label, mode, chaosKind);
        if (!url) {
          return null;
        }
        return { key: `draw-reveal-flag-${i}`, url, title: label };
      })
      .filter((item): item is { key: string; url: string; title: string } => item != null);
  }, [state.chaosDraftSourceKindsAll, state.countriesAll, state.mode]);

  const rafRef = useRef(0);

  useEffect(() => {
    if (!isReady || seedDoneRef.current) {
      return;
    }
    seedDoneRef.current = true;
    props.onSeedCpuTeamNames();
  }, [isReady, props.onSeedCpuTeamNames]);

  useEffect(() => {
    const timeStart = performance.now();

    const tick = (now: number) => {
      const elapsed = Math.min(splashMs, Math.max(0, now - timeStart));
      setElapsedMs(elapsed);

      if (elapsed < splashMs) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [splashMs]);

  const progress = Math.min(1, elapsedMs / splashMs);

  const phraseState = useMemo(
    () => getPhraseRevealState(elapsedMs, loadingPhrases, splashMs),
    [elapsedMs, loadingPhrases, splashMs],
  );

  const currentPhrase = loadingPhrases[phraseState.index] ?? '';

  return (
    <div className="draw-reveal">
      <ConfirmNewGameModal
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={props.onReset}
      />
      <div className="draw-reveal-stars" aria-hidden="true" />
      <div className="draw-reveal-inner">
        <div className="draw-reveal-version">v{APP_VERSION}</div>
        <div className="draw-reveal-badge">турнирная жеребьёвка</div>
        <h1 className="draw-reveal-title">Определение очерёдности ходов</h1>

        <div className="draw-reveal-stage" aria-live="polite">
          {!isReady ? (
            <>
              <div className="draw-reveal-ball-wrap" aria-hidden="true">
                <div className="draw-reveal-ball" />
              </div>
              <div className="draw-reveal-progress">
                <div className="draw-reveal-progress-bar" style={{ transform: `scaleX(${progress})` }} />
              </div>
              {loadingFlagItems.length > 0 ? (
                <div className="draw-reveal-loading-flags" aria-label="Страны и клубы в этой партии">
                  {loadingFlagItems.map((item) => (
                    <img
                      key={item.key}
                      src={item.url}
                      alt=""
                      className="draw-reveal-loading-flag"
                      title={item.title}
                      width={36}
                      height={24}
                    />
                  ))}
                </div>
              ) : null}
              <div className="draw-reveal-phrase-slot" aria-live="polite" aria-atomic="true">
                <p className="draw-reveal-phrase" style={{ opacity: phraseState.opacity }}>
                  {currentPhrase}
                </p>
              </div>
            </>
          ) : null}

          {isReady ? (
            <div className="draw-reveal-result">
              <DrawRevealTeamIdentitySection
                state={state}
                onSetTeamName={props.onSetTeamName}
                onSetTeamColorScheme={props.onSetTeamColorScheme}
              />
              <div className="draw-reveal-result-title draw-reveal-result-title--after-identity">
                Порядок в раунде 1
              </div>
              <ul className="draw-reveal-list">
                {round1Order.map((teamId, index) => (
                  <DrawRevealTeamRow key={teamId} index={index + 1} teamId={teamId} state={state} />
                ))}
              </ul>
              <button
                type="button"
                className="draw-reveal-cta"
                onClick={props.onContinue}
                disabled={!canAdvanceFromDrawRevealIdentity(state)}
              >
                {props.continueButtonLabel ?? 'Перейти к драфту'}
              </button>
            </div>
          ) : null}
        </div>

        <div className="draw-reveal-footer">
          <button type="button" className="draw-reveal-ghost" onClick={() => setResetConfirmOpen(true)}>
            Новая игра
          </button>
        </div>
      </div>
    </div>
  );
}
