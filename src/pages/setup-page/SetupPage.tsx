import { useState } from 'react';

import { RulesModal } from '@/shared/ui/rules-modal';

import { FORMATIONS, type FormationId } from '@/entities/game/formations';
import type { ColorSchemeId, GameMode, HintsBudget, TeamCount, TeamId, TeamState } from '@/entities/game/types';

import { FormationPreview } from '@/shared/ui/formation-preview';
import { schemeDotColor } from '@/shared/lib/schemeAccent';

import { APP_VERSION } from '@/shared/config/version';

import {
  SETUP_BEST_LINEUP_BENCH_OPTIONS,
  SETUP_HINT_BUDGETS,
  SETUP_MODE_OPTIONS,
  SETUP_SCHEME_OPTIONS,
  SETUP_TEAM_COUNTS,
} from './setup-page.constants';
import { formationLabelShort } from './setup-page.utils';

export interface SetupPageProps {
  formationLocked: boolean;
  teamOrder: TeamId[];
  teams: Record<TeamId, TeamState>;
  mode: GameMode;
  onSetTeamFormation: (team: TeamId, formation: FormationId) => void;
  onSetTeamColorScheme: (team: TeamId, scheme: ColorSchemeId) => void;
  onSetTeamCount: (count: TeamCount) => void;
  onSetMode: (mode: GameMode) => void;
  hintsBudget: HintsBudget;
  onSetHintsBudget: (budget: HintsBudget) => void;
  bestLineupIncludeBench: boolean;
  onSetBestLineupIncludeBench: (includeBench: boolean) => void;
  onStart: () => void;
}

interface CountButtonProps {
  count: TeamCount;
  isActive: boolean;
  onPick: () => void;
}

interface HintBudgetButtonProps {
  budget: HintsBudget;
  isActive: boolean;
  onPick: () => void;
}

function HintBudgetButton(props: HintBudgetButtonProps) {
  return (
    <button
      type="button"
      onClick={props.onPick}
      className={`setup-seg-btn${props.isActive ? ' setup-seg-btn--active' : ''}`}
      aria-pressed={props.isActive}
    >
      {props.budget}
    </button>
  );
}

function CountButton(props: CountButtonProps) {
  return (
    <button
      type="button"
      onClick={props.onPick}
      className={`setup-seg-btn${props.isActive ? ' setup-seg-btn--active' : ''}`}
      aria-pressed={props.isActive}
    >
      {props.count}
    </button>
  );
}

interface SchemeButtonProps {
  schemeId: ColorSchemeId;
  label: string;
  isActive: boolean;
  onPick: (scheme: ColorSchemeId) => void;
}

function SchemeButton(props: SchemeButtonProps) {
  return (
    <button
      type="button"
      onClick={() => props.onPick(props.schemeId)}
      className={`setup-scheme-btn${props.isActive ? ' setup-scheme-btn--active' : ''}`}
      aria-pressed={props.isActive}
    >
      <span className="setup-scheme-dot" style={{ background: schemeDotColor(props.schemeId) }} aria-hidden="true" />
      {props.label}
    </button>
  );
}

interface TeamBoxProps {
  teamName: string;
  activeFormation: FormationId;
  colorScheme: ColorSchemeId;
  isFormationDisabled: boolean;
  onPickScheme: (scheme: ColorSchemeId) => void;
  onPickFormation: (formation: FormationId) => void;
}

function TeamBox(props: TeamBoxProps) {
  return (
    <div className="setup-team-box">
      <div className="setup-team-name">{props.teamName}</div>
      <div className="setup-scheme-row">
        {SETUP_SCHEME_OPTIONS.map((option) => (
          <SchemeButton
            key={option.id}
            schemeId={option.id}
            label={option.label}
            isActive={props.colorScheme === option.id}
            onPick={props.onPickScheme}
          />
        ))}
      </div>
      <div className="setup-formation-grid">
        {(Object.keys(FORMATIONS) as FormationId[]).map((formationId) => (
          <button
            key={formationId}
            type="button"
            onClick={() => props.onPickFormation(formationId)}
            disabled={props.isFormationDisabled}
            className={`setup-formation-card${
              props.activeFormation === formationId ? ' setup-formation-card--active' : ''
            }`}
            title={formationLabelShort(formationId)}
          >
            <div className="setup-formation-name">{formationLabelShort(formationId)}</div>
            <FormationPreview formation={formationId} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function SetupPage(props: SetupPageProps) {
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <>
      <div className="fc-page">
        <div className="setup-card">
          <div className="setup-hero">
            <div>
              <div className="setup-kicker">
                <span className="setup-kicker-icon" aria-hidden="true">
                  ⚽
                </span>
                Настройка матча
              </div>
              <h1 className="setup-title">Футбольный драфт</h1>
              <p className="setup-sub">
                Выберите режим и число игроков, задайте цвета и схемы команд — и выходите на поле.
              </p>
            </div>
            <button type="button" onClick={() => setRulesOpen(true)} className="setup-rules-btn">
              Правила
            </button>
          </div>

          <div className="setup-section">
            <div className="setup-label-row">
              <div className="setup-label">Режим игры</div>
            </div>
            <div className="setup-seg-row">
              {SETUP_MODE_OPTIONS.map((option) => (
                <button
                  key={option.mode}
                  type="button"
                  onClick={() => props.onSetMode(option.mode)}
                  className={`setup-seg-btn${props.mode === option.mode ? ' setup-seg-btn--active' : ''}`}
                  aria-pressed={props.mode === option.mode}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="setup-section">
            <div className="setup-label-row">
              <div className="setup-label">Игроков за столом</div>
            </div>
            <div className="setup-seg-row">
              {SETUP_TEAM_COUNTS.map((count) => (
                <CountButton
                  key={count}
                  count={count}
                  isActive={props.teamOrder.length === count}
                  onPick={() => props.onSetTeamCount(count)}
                />
              ))}
            </div>
          </div>

          <div className="setup-section">
            <div className="setup-hints-grid">
              <div className="setup-hints-col">
                <div className="setup-label-row">
                  <div className="setup-label">Подсказки «Лучший состав» на команду за игру</div>
                </div>
                <div className="setup-seg-row">
                  {SETUP_HINT_BUDGETS.map((budget) => (
                    <HintBudgetButton
                      key={budget}
                      budget={budget}
                      isActive={props.hintsBudget === budget}
                      onPick={() => props.onSetHintsBudget(budget)}
                    />
                  ))}
                </div>
              </div>
              <div className="setup-hints-col">
                <div className="setup-label-row">
                  <div className="setup-label">Формат «Лучший состав» в подсказке</div>
                </div>
                <div className="setup-seg-row">
                  {SETUP_BEST_LINEUP_BENCH_OPTIONS.map((option) => (
                    <button
                      key={String(option.includeBench)}
                      type="button"
                      onClick={() => props.onSetBestLineupIncludeBench(option.includeBench)}
                      className={`setup-seg-btn${
                        props.bestLineupIncludeBench === option.includeBench ? ' setup-seg-btn--active' : ''
                      }`}
                      aria-pressed={props.bestLineupIncludeBench === option.includeBench}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="setup-section">
            <div className="setup-label-row">
              <div className="setup-label">Схема (у каждой команды своя)</div>
              {props.formationLocked ? (
                <div className="setup-muted">Смена схемы заблокирована после первого выбора</div>
              ) : null}
            </div>
            <div className="setup-team-grid">
              {props.teamOrder.map((teamId) => {
                const team = props.teams[teamId];

                return (
                  <TeamBox
                    key={teamId}
                    teamName={team.name}
                    activeFormation={team.formation}
                    colorScheme={team.colorScheme}
                    isFormationDisabled={props.formationLocked}
                    onPickScheme={(scheme) => props.onSetTeamColorScheme(teamId, scheme)}
                    onPickFormation={(formation) => props.onSetTeamFormation(teamId, formation)}
                  />
                );
              })}
            </div>
          </div>

          <div className="setup-section">
            <div className="setup-actions">
              <button type="button" onClick={props.onStart} className="setup-primary-btn">
                Начать игру
              </button>
            </div>
          </div>

          <div className="setup-version">Версия {APP_VERSION}</div>
        </div>
      </div>
      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </>
  );
}
