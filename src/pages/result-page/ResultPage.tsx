import { useCallback, useState } from 'react';

import { FORMATIONS, type FormationId } from '@/entities/game/formations';
import type { ColorSchemeId, GameState, TeamId } from '@/entities/game/types';

import { ConfirmNewGameModal } from '@/shared/ui/confirm-new-game-modal';
import { schemeAccent, schemeDotColor } from '@/shared/lib/schemeAccent';

import { SETUP_MODE_OPTIONS, SETUP_SCHEME_OPTIONS } from '@/pages/setup-page/setup-page.constants';
import { formationLabelShort } from '@/pages/setup-page/setup-page.utils';

export interface ResultPageProps {
  state: GameState;
  onReset: () => void;
}

const SIMULATION_PROMPT = `Сделай глубокую симуляцию чемпионата (каждая команда играет 50 матчей дома, 50 в гостях, по очереди)
Кто выиграет чемпионат?
Кто лучшие и худшие игроки обеих команд?
Кто лучшие бомбардиры? У кого больше Желтых Красных карточек?
Почему выиграла команда, а почему другая проиграла?`;

function schemeLabel(colorScheme: ColorSchemeId): string {
  return SETUP_SCHEME_OPTIONS.find((o) => o.id === colorScheme)?.label ?? colorScheme;
}

function buildResultExportText(state: GameState): string {
  const modeLabel =
    SETUP_MODE_OPTIONS.find((o) => o.mode === state.mode)?.label ?? String(state.mode);

  const lines: string[] = [
    'Игра завершена',
    'Итоги по командам и выбранным схемам.',
    '',
    `Режим: ${modeLabel}`,
    '',
  ];

  for (const teamId of state.teamOrder) {
    const team = state.teams[teamId];
    const formationShort = formationLabelShort(team.formation);
    lines.push(`— ${team.name} —`);
    lines.push(`Схема: ${formationShort}`);
    const rows = FORMATIONS[team.formation].rows;
    for (const row of rows) {
      for (const cell of row) {
        const pick = team.picksBySlotId[cell.slotId];
        const name = pick?.playerName ?? '—';
        const country = pick?.country ? ` (${pick.country})` : '';
        lines.push(`  ${cell.label}: ${name}${country}`);
      }
    }
    lines.push('');
  }

  lines.push(SIMULATION_PROMPT);
  return lines.join('\n');
}

interface TeamSummaryProps {
  title: string;
  colorScheme: ColorSchemeId;
  formationId: FormationId;
  picks: Record<string, { playerName: string | null; country: string | null; label: string }>;
}

function TeamSummary(props: TeamSummaryProps) {
  const rows = FORMATIONS[props.formationId].rows;
  const accent = schemeAccent(props.colorScheme);
  const dot = schemeDotColor(props.colorScheme);

  return (
    <div
      className="result-team"
      style={{
        borderLeft: `4px solid ${accent}`,
      }}
    >
      <div className="result-team-title">{props.title}</div>
      <div className="result-color-row" aria-label={`Цвет команды: ${schemeLabel(props.colorScheme)}`}>
        <span
          className="result-color-dot"
          style={{ background: dot, boxShadow: `0 0 0 1px ${accent}` }}
        />
      </div>
      <div className="result-list">
        {rows.flatMap((row) =>
          row.map((cell) => {
            const pick = props.picks[cell.slotId];
            const name = pick?.playerName ?? '—';
            const country = pick?.country ? ` (${pick.country})` : '';

            return (
              <div key={cell.slotId} className="result-item">
                <span className="result-badge" style={{ borderColor: accent }}>
                  {cell.label}
                </span>
                <span className="result-item-text">
                  {name}
                  <span className="result-muted">{country}</span>
                </span>
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

export function ResultPage(props: ResultPageProps) {
  const { state } = props;
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [copyDone, setCopyDone] = useState(false);

  const handleCopyAll = useCallback(async () => {
    const text = buildResultExportText(state);
    try {
      await navigator.clipboard.writeText(text);
      setCopyDone(true);
      window.setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setCopyDone(false);
    }
  }, [state]);

  return (
    <div className="result-page">
      <ConfirmNewGameModal
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={props.onReset}
      />
      <div className="result-card">
        <div className="setup-kicker" style={{ marginBottom: 12 }}>
          <span className="setup-kicker-icon" aria-hidden="true">
            🏆
          </span>
          Финальный свисток
        </div>
        <h1 className="result-title">Игра завершена</h1>
        <p className="result-sub">Итоги по командам и выбранным схемам.</p>

        <div
          className="result-grid"
          style={{
            gridTemplateColumns: `repeat(${Math.min(state.teamOrder.length, 4)}, minmax(0, 1fr))`,
          }}
        >
          {state.teamOrder.map((teamId: TeamId) => {
            const team = state.teams[teamId];

            return (
              <TeamSummary
                key={teamId}
                title={team.name}
                colorScheme={team.colorScheme}
                formationId={team.formation}
                picks={team.picksBySlotId}
              />
            );
          })}
        </div>

        <div className="result-actions">
          <button type="button" onClick={handleCopyAll} className="result-btn-secondary">
            {copyDone ? 'Скопировано' : 'Скопировать всё'}
          </button>
          <a
            href="https://chat.deepseek.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="result-btn-link"
          >
            Перейти к симуляции
          </a>
          <button type="button" onClick={() => setResetConfirmOpen(true)} className="result-btn-primary">
            Новая игра
          </button>
        </div>
      </div>
    </div>
  );
}
