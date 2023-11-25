import { GameType } from '../const/game.type';
import { Map } from '../enum/map.enum';

export class Players {
  id: string;

  leftX: number;

  leftY: number;

  rightX: number;

  rightY: number;

  leftDx: number;

  leftDy: number;

  rightDx: number;

  rightDy: number;

  bar: number;

  private constructor(id: string, bar: number) {
    this.id = id;
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

  static create(id: string, type: GameType) {
    if (type == GameType.HARD) return new Players(id, Map.HARDBAR);
    return new Players(id, Map.NORMALBAR);
  }
}
