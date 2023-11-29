import { Side } from '../enum/side.enum';
import { GameSetting } from '../enum/game-setting.enum';
import { Players } from './players.model';

export class Ball {
  private static readonly SPEED = 400 / GameSetting.GAME_FRAME;
  private static readonly BALL_RADIUS = 7;
  id: string;

  x: number;

  y: number;

  dx: number;

  dy: number;

  nextOwner: Side;

  private constructor(id: string) {
    this.id = id;
    this.x = GameSetting.WIDTH / 2;
    this.y = GameSetting.HEIGHT / 2;
    this.dx = -Ball.SPEED;
    this.dy = 0;
    this.nextOwner = Side.LEFT;
  }

  static create(id: string) {
    return new Ball(id);
  }

  updatePositionAndCheckCollision(players: Players) {
    //console.log('x값 : ', this.x - Ball.BALL_RADIUS);
    //console.log('left : ', this.x + Ball.BALL_RADIUS);
    if (this.x - Ball.BALL_RADIUS <= 0) return Side.RIGHT;
    if (this.x + Ball.BALL_RADIUS >= GameSetting.WIDTH) return Side.LEFT;
    if (this.checkBarCollision(players)) this.bounce();
    if (
      this.y - Ball.BALL_RADIUS <= 0 ||
      this.y + Ball.BALL_RADIUS >= GameSetting.HEIGHT
    )
      this.dy = -this.dy;
    this.checkWallCollision();
    return null;
  }

  checkBarCollision(players: Players) {
    const now = Date.now();
    //bar와 부딪혔는지에 대한 계산 -> 부딪히면? 공방향을 바꿈
    const leftBarCollision = this.calculateBarCollision(
      players.leftX,
      players.leftY,
      players.bar,
    );
    const rightBarCollision = this.calculateBarCollision(
      players.rightX,
      players.rightY,
      players.bar,
    );
    const leftCollision = this.isColliding(leftBarCollision);
    const rightCollision = this.isColliding(rightBarCollision);
    if (
      leftCollision &&
      rightCollision &&
      now - players.leftDeBounceTime > (1000 / GameSetting.GAME_FRAME) * 10 &&
      now - players.rightDeBounceTime > (1000 / GameSetting.GAME_FRAME) * 10
    ) {
      players.leftDeBounceTime = now;
      players.rightDeBounceTime = now;
      //두 쪽 모두와 충돌할때 -> 있는경우일까?... -> 무작위로 방향 바꿈 -> 이번 버전에서는 필요없을듯합니다..
      this.dx = Math.random() < 0.5 ? -this.dx : this.dx;
      this.dy = Math.random() < 0.5 ? -this.dy : this.dy;
      return true;
    }
    if (
      leftCollision &&
      now - players.leftDeBounceTime > (1000 / GameSetting.GAME_FRAME) * 10
    ) {
      players.leftDeBounceTime = now;
      return true;
    } else if (
      rightCollision &&
      now - players.rightDeBounceTime > (1000 / GameSetting.GAME_FRAME) * 10
    ) {
      players.rightDeBounceTime = now;
      return true;
    }
    return false;
  }

  init() {
    this.x = GameSetting.WIDTH / 2;
    this.y = GameSetting.HEIGHT / 2;
    this.nextOwner = this.nextOwner === Side.LEFT ? Side.RIGHT : Side.LEFT; //번갈아가면서 서브하는 경우
    if (this.nextOwner == Side.LEFT) this.dx = -Ball.SPEED;
    else this.dx = Ball.SPEED;
    this.dy = 0;
  }

  bounce() {
    //todo: 직접 해보고 부자연스러우면 바꾸기
    this.dx = -this.dx;
    //반사각 추가코드
    //const hitPosition = (this.y - barY) / Map.THICKNESS; // -1 (왼쪽 가장자리)에서 1 (오른쪽 가장자리) 사이의 값
    //const angle = (hitPosition * Math.PI) / 4;
    //this.dy = this.dy * Math.cos(angle);
  }

  updateBallPosition() {
    this.x += this.dx;
    this.y += this.dy;
    // 볼이 벽 밖으로 나가지 않도록 조정
    if (this.y - Ball.BALL_RADIUS <= 0) {
      this.y = Ball.BALL_RADIUS;
    }

    if (this.y + Ball.BALL_RADIUS >= GameSetting.HEIGHT) {
      this.y = GameSetting.HEIGHT - Ball.BALL_RADIUS;
    }
  }

  private checkWallCollision() {
    //위아래벽은 점수로 안쳤음
    if (
      this.y - Ball.BALL_RADIUS <= 0 ||
      this.y + Ball.BALL_RADIUS >= GameSetting.HEIGHT
    )
      this.dy = -this.dy;
  }

  private calculateBarCollision(barX: number, barY: number, barHeight: number) {
    return {
      top: barY + Ball.BALL_RADIUS,
      bottom: barY - barHeight - Ball.BALL_RADIUS,
      left: barX - Ball.BALL_RADIUS,
      right: barX + GameSetting.THICKNESS + Ball.BALL_RADIUS,
    };
  }

  private isColliding(barRange) {
    //부딪혔는지에 대해 계산
    return (
      this.x >= barRange.left &&
      this.x <= barRange.right &&
      this.y <= barRange.top &&
      this.y >= barRange.bottom
    );
  }
}
