import type { CSSProperties } from 'react';

import { inferChaosSourceKind } from '@/entities/game/modes/chaosDraftPool';
import { getClubFlagUrl } from '@/entities/game/data/clubCountries';
import { formationRowsForDisplay } from '@/entities/game/core/formations';
import { getCountryFlagUrlRu } from '@/entities/game/data/topCountries';
import { isChaosMode, isClubsMode, isNationalDraftSource, isNationalMode } from '@/entities/game/modes/gameMode';
import type { GameState, TeamId } from '@/entities/game/core/types';

export interface LineupEditorProps {
  state: GameState;
  onPickNameChange: (team: TeamId, slotId: string, playerName: string) => void;
}

export function LineupEditor(props: LineupEditorProps) {
  const { state } = props;

  return (
    <div style={styles.wrap}>
      <div style={styles.title}>Редактирование имён игроков</div>
      <div style={styles.grid}>
        {state.teamOrder.map((teamId) => {
          const team = state.teams[teamId];
          const rows = formationRowsForDisplay(team.formation);

          return (
            <section key={teamId} style={styles.teamSection}>
              <h3 style={styles.teamHeading}>{team.name}</h3>
              <div style={styles.slots}>
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
                      <label key={cell.slotId} style={styles.row}>
                        <span style={styles.slotLabel}>{cell.label}</span>
                        <div style={styles.fieldCol}>
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
                            style={{
                              ...styles.input,
                              ...(inputDisabled ? styles.inputDisabled : null),
                            }}
                          />
                          {sourceLabel ? (
                            <span style={styles.sourceHint}>
                              {isNationalDraftSource(state.mode, chaosKind) ? (
                                <>
                                  <span>{sourceLabel}</span>
                                  {natFlagUrl ? <img src={natFlagUrl} alt="" style={styles.hintFlag} /> : null}
                                </>
                              ) : (
                                <>
                                  <span>Клуб: {sourceLabel}</span>
                                  {clubFlagUrl ? <img src={clubFlagUrl} alt="" style={styles.hintFlag} /> : null}
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

const styles: Record<string, CSSProperties> = {
  wrap: {
    padding: '16px 18px 24px',
    flex: '1 1 auto',
    overflow: 'auto',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(0,0,0,0.2)',
  },
  title: {
    fontWeight: 800,
    fontSize: 16,
    marginBottom: 14,
    textAlign: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 16,
    alignItems: 'start',
  },
  teamSection: {
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 12,
    background: 'rgba(255,255,255,0.04)',
  },
  teamHeading: { margin: '0 0 10px', fontSize: 15, fontWeight: 750 },
  slots: { display: 'grid', gap: 8 },
  row: { display: 'grid', gridTemplateColumns: '88px 1fr', gap: 10, alignItems: 'start' },
  fieldCol: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 },
  slotLabel: { fontSize: 12, opacity: 0.8, paddingTop: 8 },
  sourceHint: {
    fontSize: 11,
    opacity: 0.72,
    lineHeight: 1.4,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  hintFlag: {
    width: 20,
    height: 14,
    objectFit: 'cover',
    borderRadius: 2,
    border: '1px solid rgba(0,0,0,0.35)',
    verticalAlign: 'middle',
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(0,0,0,0.28)',
    color: 'inherit',
    outline: 'none',
  },
  inputDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
};
