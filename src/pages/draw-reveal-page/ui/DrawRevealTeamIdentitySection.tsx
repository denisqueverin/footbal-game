import { SETUP_COLOR_SCHEME_PICKS } from '@/entities/game/core/colorSchemes';
import type { ColorSchemeId, GameState, TeamId } from '@/entities/game/core/types';
import { formatTeamDisplayName, isCpuControlledTeam } from '@/entities/game/modes/gameMode';
import { KitSchemeIcon } from '@/shared/ui/kit-scheme-icon/KitSchemeIcon';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface DrawRevealTeamIdentitySectionProps {
  state: GameState;
  onSetTeamName: (team: TeamId, name: string) => void;
  onSetTeamColorScheme: (team: TeamId, scheme: ColorSchemeId) => void;
}

export function DrawRevealTeamIdentitySection(props: DrawRevealTeamIdentitySectionProps) {
  const { state } = props;
  const ctx = {
    gameKind: state.gameKind,
    teamOrder: state.teamOrder,
    teamControllers: state.teamControllers,
  };

  return (
    <div className="draw-reveal-identity">
      <div className="draw-reveal-identity-title">Форма и название команд</div>
      <p className="draw-reveal-identity-hint">
        Выберите расцветку майки и шорт и задайте название. У нейро-команд имя подставится автоматически после
        загрузки (в режиме разработки можно выбрать ввод вручную в окне «Подсказки»).
      </p>
      <div className="draw-reveal-identity-grid">
        {state.teamOrder.map((teamId, index) => {
          const team = state.teams[teamId];
          const cpu = isCpuControlledTeam(state, teamId);
          const neuroManual = Boolean(state.devToolsEnabled && state.devNeuroTeamNameMode === 'manual');
          const nameReadOnly = cpu && !neuroManual;
          const schemeTakenByOthers = new Set(
            state.teamOrder.filter((id) => id !== teamId).map((id) => state.teams[id].colorScheme),
          );
          const displayTitle = formatTeamDisplayName(ctx, teamId, team.name);

          return (
            <div key={teamId} className="draw-reveal-identity-card">
              <div className="draw-reveal-identity-card-head">
                <span className="draw-reveal-identity-slot">Команда {index + 1}</span>
                {cpu ? <span className="draw-reveal-identity-badge">Нейро</span> : null}
              </div>
              <div className="draw-reveal-identity-display-name" title={displayTitle}>
                {displayTitle}
              </div>
              <label className="draw-reveal-identity-label" htmlFor={`draw-reveal-name-${teamId}`}>
                Название в игре
              </label>
              <input
                id={`draw-reveal-name-${teamId}`}
                type="text"
                className="draw-reveal-identity-input"
                value={team.name}
                readOnly={nameReadOnly}
                onChange={(e) => props.onSetTeamName(teamId, e.target.value)}
                placeholder={`Например: «Красные ${index + 1}»`}
                aria-label={`Название команды ${index + 1}`}
              />
              <div className="draw-reveal-identity-label draw-reveal-identity-label--spaced">Форма</div>
              <div className="draw-reveal-identity-schemes">
                {SETUP_COLOR_SCHEME_PICKS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    title={option.label}
                    aria-label={option.label}
                    aria-pressed={team.colorScheme === option.id}
                    disabled={option.id !== team.colorScheme && schemeTakenByOthers.has(option.id)}
                    onClick={() => props.onSetTeamColorScheme(teamId, option.id)}
                    className={cn(
                      'setup-scheme-btn',
                      team.colorScheme === option.id && 'setup-scheme-btn--active',
                    )}
                  >
                    <KitSchemeIcon schemeId={option.id} />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
