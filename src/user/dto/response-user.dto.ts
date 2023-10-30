import { User } from '../entities/user.entity';

export class ResponseUserDto {
  id: number;
  nickName: string;
  intraName: string;
  avatar: string;
}

export function toResponseUserDto(user: User): ResponseUserDto {
  return {
    id: user.id,
    nickName: user.nickName,
    intraName: user.intraName,
    avatar: user.avatar,
  };
}
