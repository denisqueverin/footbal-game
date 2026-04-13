import { useCallback, useState } from 'react';

import { FORMATIONS, type FormationId } from '@/entities/game/core/formations';
import type {
  CoachAssignment,
  ColorSchemeId,
  CpuDifficulty,
  GameState,
  SlotPick,
  TeamId,
} from '@/entities/game/core/types';
import { formatTeamDisplayName, isCpuControlledTeam } from '@/entities/game/modes/gameMode';
import {
  CAPTAIN_SIMULATION_PROMPT_LINE,
  COACH_SIMULATION_PROMPT_EXTRA,
} from '@/entities/game/data/coaches';

import { CaptainArmbandIcon } from '@/shared/ui/captain-armband-icon/CaptainArmbandIcon';
import { ConfirmNewGameModal } from '@/shared/ui/confirm-new-game-modal';
import { CpuDifficultyIcon } from '@/shared/ui/cpu-difficulty-icon';
import { schemeAccent, schemeLabelRu } from '@/shared/lib/schemeAccent';
import { KitSchemeIcon } from '@/shared/ui/kit-scheme-icon/KitSchemeIcon';

import { SETUP_MODE_OPTIONS, SETUP_SCHEME_OPTIONS } from '@/pages/setup-page/setup-page.constants';
import { formationLabelShort } from '@/pages/setup-page/setup-page.utils';
import { formatDraftDuration } from '@/pages/game-page/game-page.utils';
import { getCountryFlagUrlRu } from '@/entities/game/data/topCountries';

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
  return SETUP_SCHEME_OPTIONS.find((o) => o.id === colorScheme)?.label ?? schemeLabelRu(colorScheme);
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

  const nameCtx = {
    gameKind: state.gameKind,
    teamOrder: state.teamOrder,
    teamControllers: state.teamControllers,
  };

  for (const teamId of state.teamOrder) {
    const team = state.teams[teamId];
    const formationShort = formationLabelShort(team.formation);
    lines.push(`— ${formatTeamDisplayName(nameCtx, teamId, team.name)} —`);
    if (team.coach) {
      lines.push(`Тренер: ${team.coach.name} (${team.coach.countryRu})`);
    }
    lines.push(`Схема: ${formationShort}`);
    const capSlot = team.captainSlotId;
    const capPick = capSlot ? team.picksBySlotId[capSlot] : null;
    const capLabel =
      capSlot != null
        ? (() => {
            for (const row of FORMATIONS[team.formation].rows) {
              for (const cell of row) {
                if (cell.slotId === capSlot) return cell.label;
              }
            }
            return capSlot;
          })()
        : null;
    if (capPick?.playerName) {
      lines.push(`Капитан: ${capPick.playerName} (${capLabel ?? capSlot})`);
    }
    const rows = FORMATIONS[team.formation].rows;
    for (const row of rows) {
      for (const cell of row) {
        const pick = team.picksBySlotId[cell.slotId];
        const name = pick?.playerName ?? '—';
        const country = pick?.country ? ` (${pick.country})` : '';
        const capMark = cell.slotId === capSlot ? ' [капитан]' : '';
        lines.push(`  ${cell.label}: ${name}${country}${capMark}`);
      }
    }
    lines.push('');
  }

  lines.push(SIMULATION_PROMPT);
  lines.push('');
  lines.push(CAPTAIN_SIMULATION_PROMPT_LINE);
  lines.push('');
  lines.push(COACH_SIMULATION_PROMPT_EXTRA);
  return lines.join('\n');
}

interface TeamSummaryProps {
  title: string;
  colorScheme: ColorSchemeId;
  formationId: FormationId;
  picks: Record<string, SlotPick>;
  captainSlotId: string | null;
  turnTimeMs: number;
  coach: CoachAssignment | null;
  cpuDifficulty?: CpuDifficulty | null;
}

function TeamSummary(props: TeamSummaryProps) {
  const rows = FORMATIONS[props.formationId].rows;
  const accent = schemeAccent(props.colorScheme);

  return (
    <div
      className="result-team"
      style={{
        borderLeft: `4px solid ${accent}`,
      }}
    >
      <div className="result-team-title">
        <span className="result-team-title-text">{props.title}</span>
        {props.cpuDifficulty != null ? (
          <CpuDifficultyIcon difficulty={props.cpuDifficulty} className="result-team-title-diff" />
        ) : null}
      </div>
      <div className="result-team-time">Время на ходах: {formatDraftDuration(props.turnTimeMs)}</div>
      {props.coach ? (
        <>
          <div className="result-team-coach">
            {getCountryFlagUrlRu(props.coach.countryRu) ? (
              <img
                src={getCountryFlagUrlRu(props.coach.countryRu)!}
                alt=""
                className="result-team-coach-flag"
                width={32}
                height={20}
              />
            ) : null}
            <span>
              Тренер: <strong>{props.coach.name}</strong> ({props.coach.countryRu})
            </span>
          </div>
        </>
      ) : null}
      <div className="result-color-row" aria-label={`Форма команды: ${schemeLabel(props.colorScheme)}`}>
        <span className="result-kit-wrap" style={{ boxShadow: `0 0 0 1px ${accent}`, borderRadius: 8 }}>
          <KitSchemeIcon schemeId={props.colorScheme} className="result-kit-icon" />
        </span>
      </div>
      <div className="result-list">
        {rows.flatMap((row) =>
          row.map((cell) => {
            const pick = props.picks[cell.slotId];
            const name = pick?.playerName ?? '—';
            const country = pick?.country ? ` (${pick.country})` : '';

            const isCaptain = cell.slotId === props.captainSlotId;

            return (
              <div key={cell.slotId} className="result-item">
                <span className="result-badge" style={{ borderColor: accent }}>
                  {cell.label}
                </span>
                <span className="result-item-text">
                  {isCaptain ? (
                    <CaptainArmbandIcon
                      className="result-captain-armband"
                      size={20}
                      title="Капитан команды"
                    />
                  ) : null}
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
        <div className="setup-kicker result-kicker">
          <span className="setup-kicker-icon" aria-hidden="true">
            🏆
          </span>
          Финальный свисток
        </div>
        <h1 className="result-title">Игра завершена</h1>
        <p className="result-sub">
          Составы, капитаны, время на ходах — скопируйте блок ниже для симуляции в чате.
        </p>

        <div
          className="result-grid"
          style={{
            gridTemplateColumns: `repeat(${Math.min(state.teamOrder.length, 4)}, minmax(0, 1fr))`,
          }}
        >
          {state.teamOrder.map((teamId: TeamId) => {
            const team = state.teams[teamId];
            const title = formatTeamDisplayName(
              {
                gameKind: state.gameKind,
                teamOrder: state.teamOrder,
                teamControllers: state.teamControllers,
              },
              teamId,
              team.name,
            );

            return (
              <TeamSummary
                key={teamId}
                title={title}
                colorScheme={team.colorScheme}
                formationId={team.formation}
                picks={team.picksBySlotId}
                captainSlotId={team.captainSlotId ?? null}
                turnTimeMs={state.draftTurnAccumMs[teamId] ?? 0}
                coach={state.teams[teamId].coach}
                cpuDifficulty={
                  isCpuControlledTeam(state, teamId) ? state.cpuDifficultyByTeam[teamId] : null
                }
              />
            );
          })}
        </div>

        <p className="result-simulation-note">
          <strong>Симуляция в чате.</strong> Нажмите «Скопировать всё» — в буфер обмена попадут итоги драфта и готовый
          текст для модели. Затем «Перейти к симуляции», вставьте в поле чата скопированное (
          <kbd className="result-kbd">Ctrl</kbd>
          {' + '}
          <kbd className="result-kbd">V</kbd> на ПК или «Вставить» на телефоне) и отправьте сообщение.{' '}
          <strong>Капитаны:</strong> {CAPTAIN_SIMULATION_PROMPT_LINE}{' '}
          <strong>Тренеры:</strong> {COACH_SIMULATION_PROMPT_EXTRA}
        </p>

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
