import { User } from '../entities/user.entity';

export class ResponseUserDto {
  nickName: string;
  intraName: string;
  achievements: string[];
  avatar: string;
  rankScore: number;
}

export function toResponseUserDto(user: User): ResponseUserDto {
  return {
    nickName: user.nickName,
    intraName: user.intraName,
    achievements: user.achievements,
    avatar: user.avatar,
    rankScore: user.rankScore,
  };
}
