import { useMemo, useState } from 'react';

import { formationRowsForDisplay } from '@/entities/game/core/formations';
import type { GameState, TeamId } from '@/entities/game/core/types';
import { formatTeamDisplayName } from '@/entities/game/modes/gameMode';

import { APP_VERSION } from '@/shared/config/version';
import { CaptainArmbandIcon } from '@/shared/ui/captain-armband-icon/CaptainArmbandIcon';
import { ConfirmNewGameModal } from '@/shared/ui/confirm-new-game-modal';

export interface CaptainPickPageProps {
  state: GameState;
  onSelectCaptain: (team: TeamId, slotId: string) => void;
  onReset: () => void;
}

export function CaptainPickPage(props: CaptainPickPageProps) {
  const { state } = props;
  const cp = state.captainPick;
  const [resetOpen, setResetOpen] = useState(false);

  const order = state.teamOrder;
  const activeIndex = cp?.activeIndex ?? 0;
  const activeTeamId = order[activeIndex] ?? null;

  const ctx = useMemo(
    () => ({
      gameKind: state.gameKind,
      teamOrder: state.teamOrder,
      teamControllers: state.teamControllers,
    }),
    [state.gameKind, state.teamControllers, state.teamOrder],
  );

  const team = activeTeamId ? state.teams[activeTeamId] : null;

  const candidates = useMemo(() => {
    if (!team) return [];
    const rows = formationRowsForDisplay(team.formation);
    const out: Array<{ slotId: string; label: string; name: string }> = [];
    for (const row of rows) {
      for (const cell of row) {
        const pick = team.picksBySlotId[cell.slotId];
        const name = pick?.playerName?.trim();
        if (!name) continue;
        out.push({ slotId: cell.slotId, label: cell.label, name });
      }
    }
    return out;
  }, [team]);

  if (!cp || !activeTeamId || !team) {
    return null;
  }

  const displayName = formatTeamDisplayName(ctx, activeTeamId, team.name);

  return (
    <div className="captain-pick-page">
      <ConfirmNewGameModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={props.onReset}
      />
      <div className="captain-pick-backdrop" aria-hidden="true" />
      <div
        className="captain-pick-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="captain-pick-title"
      >
        <div className="captain-pick-version">v{APP_VERSION}</div>
        <div className="captain-pick-icon-wrap" aria-hidden="true">
          <CaptainArmbandIcon size={56} />
        </div>
        <h1 id="captain-pick-title" className="captain-pick-title">
          Выберите капитана команды
        </h1>
        <p className="captain-pick-sub">
          Команда: <strong>{displayName}</strong>
        </p>
        <p className="captain-pick-hint">Нажмите на игрока из состава — он станет капитаном.</p>
        <ul className="captain-pick-list">
          {candidates.map((c) => (
            <li key={c.slotId}>
              <button
                type="button"
                className="captain-pick-choice"
                onClick={() => props.onSelectCaptain(activeTeamId, c.slotId)}
              >
                <CaptainArmbandIcon className="captain-pick-choice-icon" size={22} />
                <span className="captain-pick-choice-meta">
                  <span className="captain-pick-choice-label">{c.label}</span>
                  <span className="captain-pick-choice-name">{c.name}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="captain-pick-foot">
          <button type="button" className="captain-pick-ghost" onClick={() => setResetOpen(true)}>
            Новая игра
          </button>
        </div>
      </div>
    </div>
  );
}
