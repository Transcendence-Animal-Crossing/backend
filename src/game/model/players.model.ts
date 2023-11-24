import { Column } from 'typeorm';
import { GameType } from '../const/game.type';
import { Map } from '../enum/map.enum';

export class Players {
  id: string;

  @Column('double')
  leftX: number;

  @Column('double')
  leftY: number;

  @Column('double')
  rightX: number;

  @Column('double')
  rightY: number;

  leftDx: number;

  leftDy: number;

  rightDx: number;

  rightDy: number;

  bar: number;

  private constructor(gameUuid: string, bar: number) {
    this.id = gameUuid;
    this.leftX = Map.FIRST_X;
    this.leftY = Map.HEIGHT / 2 + bar / 2;
    this.rightX = Map.WIDTH - Map.FIRST_X - Map.THICKNESS;
    this.rightY = Map.HEIGHT / 2 + bar / 2;
    this.leftDx = 0;
    this.leftDy = 0;
    this.rightDx = 0;
    this.rightDy = 0;
    this.bar = bar;
  }

  static create(gameUuid: string, type: GameType) {
    if (type == GameType.HARD) return new Players(gameUuid, Map.HARDBAR);
    return new Players(gameUuid, Map.NORMALBAR);
  }
}
