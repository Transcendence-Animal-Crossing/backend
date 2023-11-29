import { GameType } from '../enum/game.type.enum';
import { Game } from '../model/game.model';
import { UserProfile } from '../../user/model/user.profile.model';

export class SimpleGameDto {
  id: string;
  leftUser: UserProfile;
  rightUser: UserProfile;
  type: GameType;

  constructor(
    id: string,
    leftUser: UserProfile,
    rightUser: UserProfile,
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
