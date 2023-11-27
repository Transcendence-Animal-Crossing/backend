import { UserData } from '../../room/data/user.data';
import { GameType } from '../enum/game.type.enum';
import { GameStatus } from '../enum/game.status.enum';
import { Game } from '../model/game.model';

export class GameInfoDto {
  public static readonly MAX_SCORE = 10;
  id: string;
  leftUser: UserData;
  rightUser: UserData;
  leftScore: number;
  rightScore: number;
  startTime: Date;
  type: GameType;
  status: GameStatus;

  constructor(
    id: string,
    leftUser: UserData,
    rightUser: UserData,
    leftScore: number,
    rightScore: number,
    startTime: Date,
    type: GameType,
    status: GameStatus,
  ) {
    this.id = id;
    this.leftUser = leftUser;
    this.rightUser = rightUser;
    this.leftScore = leftScore;
    this.rightScore = rightScore;
    this.startTime = startTime;
    this.type = type;
    this.status = status;
  }

  static from(game: Game) {
    return new GameInfoDto(
      game.id,
      game.leftUser,
      game.rightUser,
      game.leftScore === -1 ? 0 : game.leftScore,
      game.rightScore === -1 ? 0 : game.rightScore,
      game.startTime,
      game.type,
      game.status,
    );
  }
}
