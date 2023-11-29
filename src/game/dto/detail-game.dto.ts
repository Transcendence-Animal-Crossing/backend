import { GameType } from '../enum/game.type.enum';
import { GameStatus } from '../enum/game.status.enum';
import { Game } from '../model/game.model';
import { UserProfile } from '../../user/model/user.profile.model';

export class DetailGameDto {
  id: string;
  leftUser: UserProfile;
  rightUser: UserProfile;
  leftScore: number;
  rightScore: number;
  startTime: Date;
  type: GameType;
  status: GameStatus;

  constructor(
    id: string,
    leftUser: UserProfile,
    rightUser: UserProfile,
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
    return new DetailGameDto(
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
