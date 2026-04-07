import { inferChaosSourceKind } from '@/entities/game/chaosDraftPool';
import { getClubFlagUrl } from '@/entities/game/clubCountries';
import { formationRowsForDisplay } from '@/entities/game/formations';
import { getCountryFlagUrlRu } from '@/entities/game/topCountries';
import { isChaosMode, isClubsMode, isNationalDraftSource, isNationalMode } from '@/entities/game/gameMode';
import type { GameState, TeamId } from '@/entities/game/types';

export interface LineupEditorProps {
  state: GameState;
  onPickNameChange: (team: TeamId, slotId: string, playerName: string) => void;
}

export function LineupEditor(props: LineupEditorProps) {
  const { state } = props;

  return (
    <div className="lineup-editor-wrap">
      <h2 className="lineup-editor-title">Редактирование состава</h2>
      <div className="lineup-editor-grid">
        {state.teamOrder.map((teamId) => {
          const team = state.teams[teamId];
          const rows = formationRowsForDisplay(team.formation);

          return (
            <section key={teamId} className="lineup-team-section">
              <h3 className="lineup-team-heading">{team.name}</h3>
              <div className="lineup-slots">
                {rows.flatMap((row) =>
                  row.map((cell) => {
                    const pick = team.picksBySlotId[cell.slotId];
                    const value = pick?.playerName ?? '';
                    const sourceLabel = pick?.country;
                    const chaosKind = isChaosMode(state.mode) ? inferChaosSourceKind(sourceLabel) : null;
                    const clubFlagUrl =
                      isClubsMode(state.mode) || (isChaosMode(state.mode) && chaosKind !== 'national')
                        ? getClubFlagUrl(sourceLabel)
                        : null;
                    const natFlagUrl =
                      isNationalMode(state.mode) || (isChaosMode(state.mode) && chaosKind === 'national')
                        ? getCountryFlagUrlRu(sourceLabel)
                        : null;
                    /** Только слоты, где уже был ход драфта (есть клуб/страна); пустые клетки не трогаем. */
                    const hasDraftPick = Boolean(pick?.country);
                    const inputDisabled = !hasDraftPick;

                    return (
                      <label key={cell.slotId} className="lineup-row">
                        <span className="lineup-slot-label">{cell.label}</span>
                        <div className="lineup-field-col">
                          <input
                            type="text"
                            value={value}
                            onChange={(event) =>
                              props.onPickNameChange(teamId, cell.slotId, event.target.value)
                            }
                            placeholder="Имя игрока"
                            disabled={inputDisabled}
                            title={
                              inputDisabled
                                ? 'Сначала выберите игрока в драфте — пустые слоты здесь не редактируются'
                                : undefined
                            }
                            className="lineup-input"
                          />
                          {sourceLabel ? (
                            <span className="lineup-source-hint">
                              {isNationalDraftSource(state.mode, chaosKind) ? (
                                <>
                                  <span>{sourceLabel}</span>
                                  {natFlagUrl ? <img src={natFlagUrl} alt="" className="lineup-hint-flag" /> : null}
                                </>
                              ) : (
                                <>
                                  <span>Клуб: {sourceLabel}</span>
                                  {clubFlagUrl ? <img src={clubFlagUrl} alt="" className="lineup-hint-flag" /> : null}
                                </>
                              )}
                            </span>
                          ) : null}
                        </div>
                      </label>
                    );
                  }),
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
