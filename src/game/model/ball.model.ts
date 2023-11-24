import { Column } from 'typeorm';
import { Side } from '../enum/side.enum';
import { Map } from '../enum/map.enum';

export class Ball {
  id: string;

  @Column('double')
  x: number;

  @Column('double')
  y: number;

  dx: number;

  dy: number;

  @Column({
    type: 'enum',
    enum: Side,
  })
  nextOwner: Side;

  private constructor(gameUuid: string) {
    this.id = gameUuid;
    this.x = Map.WIDTH / 2;
    this.y = Map.HEIGHT / 2;
    this.dx = 0;
    this.dy = 0;
    this.nextOwner = Side.LEFT;
  }

  static create(gameUuid: string) {
    return new Ball(gameUuid);
  }
}
