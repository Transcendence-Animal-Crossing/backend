import { Players } from './players.model';
import { Side } from '../enum/side.enum';
import { Ball } from './ball.model';
import { GameSetting } from '../enum/game-setting.enum';

export class Position {
  x: number;
  y: number;
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  static fromPlayers(players: Players, side: Side) {
    if (side === Side.LEFT)
      return new Position(players.leftX, GameSetting.HEIGHT - players.leftY);
    if (side === Side.RIGHT)
      return new Position(players.rightX, GameSetting.HEIGHT - players.rightY);
  }

  static fromBall(ball: Ball) {
    return new Position(ball.x, ball.y);
  }
}
