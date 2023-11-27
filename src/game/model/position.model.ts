import { Players } from './players.model';
import { Side } from '../enum/side.enum';
import { Ball } from './ball.model';

export class Position {
  x: number;
  y: number;
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  static fromPlayers(players: Players, side: Side) {
    if (side === Side.LEFT) return new Position(players.leftX, players.leftY);
    if (side === Side.RIGHT)
      return new Position(players.rightX, players.rightY);
  }

  static fromBall(ball: Ball) {
    return new Position(ball.x, ball.y);
  }
}
