import { GameType } from '../enum/game.type.enum';
import { Map } from '../enum/map.enum';
import { GameKey } from '../enum/game.key.enum';
import { Side } from '../enum/side.enum';

export class Players {
  private static readonly SPEED = 250 / Map.GAME_FRAME;
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

  async updatePlayersPosition() {
    this.leftX += this.leftDx;
    this.leftY += this.leftDy;
    this.rightX += this.rightDx;
    this.rightY += this.rightDy;

    this.leftX = Math.max(this.leftX, 0);
    this.leftX = Math.min(this.leftX, Map.WIDTH / 2 - Map.THICKNESS);
    this.leftY = Math.max(this.leftY, this.bar);
    this.leftY = Math.min(this.leftY, Map.HEIGHT);

    this.rightX = Math.max(this.rightX, Map.WIDTH / 2);
    this.rightX = Math.min(this.rightX, Map.WIDTH - Map.THICKNESS);
    this.rightY = Math.max(this.rightY, this.bar);
    this.rightY = Math.min(this.rightY, Map.HEIGHT);
  }

  init() {
    this.leftX = Map.FIRST_X;
    this.leftY = Map.HEIGHT / 2 + this.bar / 2;
    this.rightX = Map.WIDTH - Map.FIRST_X - Map.THICKNESS;
    this.rightY = Map.HEIGHT / 2 + this.bar / 2;
    this.leftDx = 0;
    this.leftDy = 0;
    this.rightDx = 0;
    this.rightDy = 0;
  }
}
