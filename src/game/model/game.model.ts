import { v1 as uuid } from 'uuid';
import { GameType } from '../enum/game.type.enum';
import { UserData } from '../../room/data/user.data';
import { User } from '../../user/entities/user.entity';
import { GameStatus } from '../enum/game.status.enum';

export class Game {
  id: string;
  leftUser: UserData;
  rightUser: UserData;
  leftScore: number;
  rightScore: number;
  startTime: Date;
  type: GameType;
  status: GameStatus;

  constructor(leftUser: UserData, rightUser: UserData, type: GameType) {
    this.id = uuid();
    this.leftUser = leftUser;
    this.rightUser = rightUser;
    this.type = type;
    this.leftScore = -1;
    this.rightScore = -1;
    this.startTime = null;
  }

  static create(leftUser: User, rightUser: User, type: GameType) {
    return new Game(UserData.from(leftUser), UserData.from(rightUser), type);
  }
}
