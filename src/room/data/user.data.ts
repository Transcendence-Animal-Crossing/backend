import { User } from '../../user/entities/user.entity';
import { ParticipantData } from './participant.data';

export class UserData {
  constructor(user: User) {
    this.id = user.id;
    this.nickName = user.nickName;
    this.intraName = user.intraName;
    this.avatar = user.avatar;
  }
  id: number;
  nickName: string;
  intraName: string;
  avatar: string;

  static compressParticipant(participant: ParticipantData) {
    return {
      id: participant.id,
      nickName: participant.nickName,
      intraName: participant.intraName,
      avatar: participant.avatar,
    };
  }
}
