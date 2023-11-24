import { User } from '../../user/entities/user.entity';
import { ParticipantData } from './participant.data';

export class UserData {
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
    return new UserData(id, nickName, intraName, avatar);
  }

  public static from(user: User): UserData {
    return new UserData(user.id, user.nickName, user.intraName, user.avatar);
  }

  public static compressToParticipant(participant: ParticipantData): UserData {
    return {
      id: participant.id,
      nickName: participant.nickName,
      intraName: participant.intraName,
      avatar: participant.avatar,
    };
  }
}
