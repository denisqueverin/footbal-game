import type { GameState, TeamId } from '@/entities/game/types';

import { schemeAccent } from '@/shared/lib/schemeAccent';

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
      <span className="draw-reveal-li-name">{team.name}</span>
    </li>
  );
}
