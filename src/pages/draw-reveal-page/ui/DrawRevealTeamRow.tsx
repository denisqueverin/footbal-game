import type { GameState, TeamId } from '@/entities/game/core/types';
import { isCpuControlledTeam } from '@/entities/game/modes/gameMode';

import { schemeAccent } from '@/shared/lib/schemeAccent';
import { CpuDifficultyIcon } from '@/shared/ui/cpu-difficulty-icon';

export interface DrawRevealTeamRowProps {
  index: number;
  teamId: TeamId;
  state: GameState;
}

export function DrawRevealTeamRow(props: DrawRevealTeamRowProps) {
  const team = props.state.teams[props.teamId];
  const accent = schemeAccent(team.colorScheme);

  return (
    <li className="draw-reveal-li">
      <span className="draw-reveal-li-num" style={{ borderColor: accent, color: accent }}>
        {props.index}
      </span>
      <span className="draw-reveal-li-name">
        <span className="draw-reveal-li-name-text">{team.name}</span>
        {isCpuControlledTeam(props.state, props.teamId) ? (
          <CpuDifficultyIcon difficulty={props.state.cpuDifficultyByTeam[props.teamId]} />
        ) : null}
      </span>
    </li>
  );
}
