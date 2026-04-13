import type { GameState, TeamId } from '@/entities/game/core/types';
import { formatTeamDisplayName, isCpuControlledTeam } from '@/entities/game/modes/gameMode';

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
  const displayName = formatTeamDisplayName(
    {
      gameKind: props.state.gameKind,
      teamOrder: props.state.teamOrder,
      teamControllers: props.state.teamControllers,
    },
    props.teamId,
    team.name,
  );

  return (
    <li className="draw-reveal-li">
      <span className="draw-reveal-li-num" style={{ borderColor: accent, color: accent }}>
        {props.index}
      </span>
      <span className="draw-reveal-li-name">
        <span className="draw-reveal-li-name-text">{displayName}</span>
        {isCpuControlledTeam(props.state, props.teamId) ? (
          <CpuDifficultyIcon difficulty={props.state.cpuDifficultyByTeam[props.teamId]} />
        ) : null}
      </span>
    </li>
  );
}
