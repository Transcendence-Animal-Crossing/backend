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

  //checkWallCollision(): boolean {
  //  //벽과 부딪혔는지 계산
  //  return (
  //    this.y - Map.BALL_RADIUS <= 0 ||
  //    this.y + Map.BALL_RADIUS >= Map.HEIGHT ||
  //    this.x - Map.BALL_RADIUS <= 0 ||
  //    this.x + Map.BALL_RADIUS >= Map.WIDTH
  //  );
  //}

  private checkWallCollision() {
    //위아래벽은 점수로 안쳤음
    if (this.y - Map.BALL_RADIUS <= 0 || this.y + Map.BALL_RADIUS >= Map.HEIGHT)
      this.dy = -this.dy;
  }
  updatePositionAndCheckCollision(players: Players): Side | null {
    if (this.x - Map.BALL_RADIUS <= 0) return Side.RIGHT;
    if (this.x + Map.BALL_RADIUS >= Map.WIDTH) return Side.LEFT;
    if (this.checkBarCollision(players)) this.bounce();
    if (this.y - Map.BALL_RADIUS <= 0 || this.y + Map.BALL_RADIUS >= Map.HEIGHT)
      this.dy = -this.dy;
    this.checkWallCollision();
  }

  checkBarCollision(players: Players): boolean {
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
    if (leftCollision && rightCollision) {
      //두 쪽 모두와 충돌할때 -> 있는경우일까?... -> 무작위로 방향 바꿈
      this.dx = Math.random() < 0.5 ? -this.dx : this.dx;
      this.dy = Math.random() < 0.5 ? -this.dy : this.dy;
      return true;
    }
    return leftCollision || rightCollision;
  }

  private calculateBarCollision(barX: number, barY: number, barHeight: number) {
    return {
      top: barY + barHeight / 2 + Map.BALL_RADIUS,
      bottom: barY - barHeight / 2 - Map.BALL_RADIUS,
      left: barX - Map.BALL_RADIUS,
      right: barX + Map.THICKNESS + Map.BALL_RADIUS,
    };
  }

  private isColliding(barRange): boolean {
    //부딪혔는지에 대해 계산
    return (
      this.x >= barRange.left &&
      this.x <= barRange.right &&
      this.y <= barRange.top &&
      this.y >= barRange.bottom
    );
  }

  initBall() {
    this.x = Map.WIDTH / 2;
    this.y = Map.HEIGHT / 2;
    if (this.nextOwner == Side.LEFT) this.dx = Map.BALL_SPEED;
    else this.dx = -Map.BALL_SPEED;
    this.dy = 0;
    this.nextOwner = this.nextOwner === Side.LEFT ? Side.RIGHT : Side.LEFT; //번갈아가면서 서브하는 경우
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
    if (this.y - Map.BALL_RADIUS <= 0) {
      this.y = Map.BALL_RADIUS;
    }

    if (this.y + Map.BALL_RADIUS >= Map.HEIGHT) {
      this.y = Map.HEIGHT - Map.BALL_RADIUS;
    }
  }
}
