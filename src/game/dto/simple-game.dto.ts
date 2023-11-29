import { UserData } from '../../room/data/user.data';
import { GameType } from '../enum/game.type.enum';
import { Game } from '../model/game.model';

export class SimpleGameDto {
  id: string;
  leftUser: UserData;
  rightUser: UserData;
  type: GameType;

  constructor(
    id: string,
    leftUser: UserData,
    rightUser: UserData,
    type: GameType,
  ) {
    this.id = id;
    this.leftUser = leftUser;
    this.rightUser = rightUser;
    this.type = type;
  }

  static from(game: Game) {
    return new SimpleGameDto(game.id, game.leftUser, game.rightUser, game.type);
  }
}
