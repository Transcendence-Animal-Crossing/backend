import { User } from '../../user/entities/user.entity';

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
}
