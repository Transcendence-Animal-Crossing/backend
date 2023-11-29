import { v1 as uuid } from 'uuid';
import { GameType } from '../enum/game.type.enum';
import { UserProfile } from '../../user/model/user.profile.model';
import { User } from '../../user/entities/user.entity';
import { GameStatus } from '../enum/game.status.enum';
import { Ball } from './ball.model';
import { Players } from './players.model';
import { Side } from '../enum/side.enum';

export class Game {
  public static readonly MAX_SCORE = 3;
  public static readonly READY_TIMEOUT = 30000;
  public static readonly ROUND_INTERVAL = 3000;
  id: string;
  leftUser: UserProfile;
  rightUser: UserProfile;
  leftScore: number;
  rightScore: number;
  startTime: Date;
  type: GameType;
  status: GameStatus;
  ball: Ball;
  players: Players;

  constructor(leftUser: UserProfile, rightUser: UserProfile, type: GameType) {
    this.id = uuid();
    this.leftUser = leftUser;
    this.rightUser = rightUser;
    this.type = type;
    this.leftScore = -1;
    this.rightScore = -1;
    this.startTime = null;
    this.status = GameStatus.WAITING;
    this.ball = Ball.create(this.id);
    this.players = Players.create(this.id, type);
  }

  static create(leftUser: User, rightUser: User, type: GameType) {
    return new Game(
      UserProfile.fromUser(leftUser),
      UserProfile.fromUser(rightUser),
      type,
    );
  }

  setUserReady(userId: number) {
    if (this.leftUser.id === userId) this.leftScore = 0;
    if (this.rightUser.id === userId) this.rightScore = 0;
  }

  setUserUnready(userId: number) {
    if (this.leftUser.id === userId) this.leftScore = -1;
    if (this.rightUser.id === userId) this.rightScore = -1;
  }

  setStart() {
    this.startTime = new Date();
    this.status = GameStatus.PLAYING;
  }

  isEveryoneReady() {
    return this.leftScore >= 0 && this.rightScore >= 0;
  }

  isEveryoneUnready() {
    return this.leftScore < 0 && this.rightScore < 0;
  }

  findOpponent(userId: number) {
    if (this.leftUser.id === userId) return this.rightUser;
    if (this.rightUser.id === userId) return this.leftUser;
    return null;
  }

  findUnReadyOne() {
    if (this.leftScore < 0) return this.leftUser.id;
    if (this.rightScore < 0) return this.rightUser.id;
    return null;
  }

  getPlayTime() {
    if (this.status === GameStatus.EARLY_FINISHED) return 0;
    return (new Date().getTime() - this.startTime.getTime()) / 1000;
  }

  loseByDisconnect(userId: number) {
    if (this.leftUser.id === userId) {
      this.leftScore = Game.MAX_SCORE;
      this.rightScore = 10;
    }
    if (this.rightUser.id === userId) {
      this.rightScore = 0;
      this.leftScore = Game.MAX_SCORE;
    }
    this.status = GameStatus.EARLY_FINISHED;
  }

  updateScore(collisionSide: Side) {
    if (collisionSide === Side.LEFT) {
      this.leftScore++;
    } else if (collisionSide === Side.RIGHT) {
      this.rightScore++;
    }
  }

  isEnd() {
    return (
      this.leftScore >= Game.MAX_SCORE || this.rightScore >= Game.MAX_SCORE
    );
  }
}
