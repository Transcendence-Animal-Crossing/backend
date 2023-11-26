import { User } from '../entities/user.entity';
import { Participant } from '../../room/model/participant.model';

export class UserProfile {
  protected constructor(
    id: number,
    nickName: string,
    intraName: string,
    avatar: string,
  ) {
    this.id = id;
    this.nickName = nickName;
    this.intraName = intraName;
    this.avatar = avatar;
  }

  id: number;
  nickName: string;
  intraName: string;
  avatar: string;

  public static create(
    id: number,
    nickName: string,
    intraName: string,
    avatar: string,
  ) {
    return new UserProfile(id, nickName, intraName, avatar);
  }

  public static fromUser(user: User): UserProfile {
    return new UserProfile(user.id, user.nickName, user.intraName, user.avatar);
  }

  public static fromParticipant(participant: Participant): UserProfile {
    return {
      id: participant.id,
      nickName: participant.nickName,
      intraName: participant.intraName,
      avatar: participant.avatar,
    };
  }
}
