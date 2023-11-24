import { User } from '../../user/entities/user.entity';
import { ParticipantData } from './participant.data';

export class UserData {
  protected constructor(user: User) {
    this.id = user.id;
    this.nickName = user.nickName;
    this.intraName = user.intraName;
    this.avatar = user.avatar;
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
    const user = new User();
    user.id = id;
    user.nickName = nickName;
    user.intraName = intraName;
    user.avatar = avatar;
    return new UserData(user);
  }

  public static from(user: User): UserData {
    return new UserData(user);
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
