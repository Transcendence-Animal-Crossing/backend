import { GameType } from '../enum/game.type.enum';
import { Map } from '../enum/map.enum';
import { GameKey } from '../enum/game.key.enum';
import { Side } from '../enum/side.enum';

export class Players {
  private static readonly SPEED = 10;
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
    this.leftY = Map.HEIGHT / 2 + bar;
    this.rightX = Map.WIDTH - Map.FIRST_X - Map.THICKNESS;
    this.rightY = Map.HEIGHT / 2 + bar;
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

  move(side: Side, key: GameKey) {
    if (side === Side.LEFT) {
      if (key === GameKey.UP) {
        this.leftDy = Players.SPEED;
      } else if (key === GameKey.DOWN) {
        this.leftDy = -Players.SPEED;
      } else if (key === GameKey.LEFT) {
        this.leftDx = -Players.SPEED;
      } else if (key === GameKey.RIGHT) {
        this.leftDx = Players.SPEED;
      }
    }
    if (side === Side.RIGHT) {
      if (key === GameKey.UP) {
        this.rightDy = Players.SPEED;
      } else if (key === GameKey.DOWN) {
        this.rightDy = -Players.SPEED;
      } else if (key === GameKey.LEFT) {
        this.rightDx = -Players.SPEED;
      } else if (key === GameKey.RIGHT) {
        this.rightDx = Players.SPEED;
      }
    }
  }

  stop(side: Side, key: GameKey) {
    if (side === Side.LEFT) {
      if (key === GameKey.UP) {
        this.leftDy = 0;
      } else if (key === GameKey.DOWN) {
        this.leftDy = 0;
      } else if (key === GameKey.LEFT) {
        this.leftDx = 0;
      } else if (key === GameKey.RIGHT) {
        this.leftDx = 0;
      }
    }
    if (side === Side.RIGHT) {
      if (key === GameKey.UP) {
        this.rightDy = 0;
      } else if (key === GameKey.DOWN) {
        this.rightDy = 0;
      } else if (key === GameKey.LEFT) {
        this.rightDx = 0;
      } else if (key === GameKey.RIGHT) {
        this.rightDx = 0;
      }
    }
  }
}
