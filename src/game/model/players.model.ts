import { GameType } from '../enum/game.type.enum';
import { GameSetting } from '../enum/game-setting.enum';
import { GameKey } from '../enum/game.key.enum';
import { Side } from '../enum/side.enum';

export class Players {
  private static readonly SPEED = 250 / GameSetting.GAME_FRAME;
  private static readonly LEFT_X_MAX =
    GameSetting.WIDTH / 2 - GameSetting.THICKNESS - GameSetting.BARRIER;
  private static readonly RIGHT_X_MIN =
    GameSetting.WIDTH / 2 + GameSetting.BARRIER;

  private static readonly RIGHT_X_MAX =
    GameSetting.WIDTH - GameSetting.THICKNESS;

  id: string;

  leftX: number;

  leftY: number;

  rightX: number;

  rightY: number;

  leftDx: number;

  leftDy: number;

  rightDx: number;

  rightDy: number;

  leftDeBounceTime: number;

  rightDeBounceTime: number;

  bar: number;

  private constructor(id: string, bar: number) {
    this.id = id;
    this.leftX = GameSetting.FIRST_X;
    this.leftY = GameSetting.HEIGHT / 2 + bar / 2;
    this.rightX =
      GameSetting.WIDTH - GameSetting.FIRST_X - GameSetting.THICKNESS;
    this.rightY = GameSetting.HEIGHT / 2 + bar / 2;
    this.leftDx = 0;
    this.leftDy = 0;
    this.rightDx = 0;
    this.rightDy = 0;
    this.bar = bar;
    this.leftDeBounceTime = Date.now();
    this.rightDeBounceTime = Date.now();
  }

  static create(id: string, type: GameType) {
    if (type == GameType.HARD) return new Players(id, GameSetting.HARDBAR);
    return new Players(id, GameSetting.NORMALBAR);
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

  updatePlayersPosition() {
    this.leftX += this.leftDx;
    this.leftY += this.leftDy;
    this.rightX += this.rightDx;
    this.rightY += this.rightDy;

    this.leftX = Math.max(this.leftX, 0);
    this.leftX = Math.min(this.leftX, Players.LEFT_X_MAX);
    this.leftY = Math.max(this.leftY, this.bar);
    this.leftY = Math.min(this.leftY, GameSetting.HEIGHT);

    this.rightX = Math.max(this.rightX, Players.RIGHT_X_MIN);
    this.rightX = Math.min(this.rightX, Players.RIGHT_X_MAX);
    this.rightY = Math.max(this.rightY, this.bar);
    this.rightY = Math.min(this.rightY, GameSetting.HEIGHT);
  }

  init() {
    this.leftX = GameSetting.FIRST_X;
    this.leftY = GameSetting.HEIGHT / 2 + this.bar / 2;
    this.rightX =
      GameSetting.WIDTH - GameSetting.FIRST_X - GameSetting.THICKNESS;
    this.rightY = GameSetting.HEIGHT / 2 + this.bar / 2;
    this.leftDx = 0;
    this.leftDy = 0;
    this.rightDx = 0;
    this.rightDy = 0;
  }
}
