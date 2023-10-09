import { User } from '../entities/user.entity';

export class ResponseUserDto {
  nickName: string;
  intraName: string;
  //achievement 추가
  avatar: string;
  rankScore: number;
}

export function toResponseUserDto(user: User): ResponseUserDto {
  return {
    nickName: user.nickName,
    intraName: user.intraName,
    avatar: user.avatar,
    rankScore: user.rankScore,
  };
}
