import { User } from '../entities/user.entity';
import { ResponseUserDto, toResponseUserDto } from './response-user.dto';

export class DetailResponseUserDto extends ResponseUserDto {
  achievements: string[];
}

export function toDetailResponseUserDto(user: User): DetailResponseUserDto {
  return {
    ...toResponseUserDto(user),
    achievements: user.achievements,
  };
}
