import { User } from '../entities/user.entity';

export class UserDto {
  constructor(user: User) {
    this.id = user.id;
    this.nickName = user.nickName;
    this.intraName = user.intraName;
    this.avatar = user.avatar;
    this.isOnline = false;
  }
  id: number;
  nickName: string;
  intraName: string;
  avatar: string;
  isOnline: boolean;
}
