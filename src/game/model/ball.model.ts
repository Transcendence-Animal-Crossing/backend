import { Side } from '../enum/side.enum';
import { Map } from '../enum/map.enum';
import { Players } from './players.model';

export class Ball {
  id: string;

  x: number;

  y: number;

  dx: number;

  dy: number;

  nextOwner: Side;

  private constructor(id: string) {
    this.id = id;
    this.x = Map.WIDTH / 2;
    this.y = Map.HEIGHT / 2;
    this.dx = 0;
    this.dy = 0;
    this.nextOwner = Side.LEFT;
  }

  static create(id: string) {
    return new Ball(id);
  }

  update() {
    /**
     * TODO: update ball position
     */
  }

  processCollision(players: Players) {
    /**
     * TODO: check collision with players and Walls
     */
  }

  checkGoal(): Side {
    /**
     * TODO: check goal
     */
    return undefined;
  }

  reset(side: Side) {
    /**
     * TODO: reset ball position
     */
  }
}
