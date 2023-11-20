import { User } from '../entities/user.entity';
import { ResponseUserDto, toResponseUserDto } from './response-user.dto';

export class DetailResponseUserDto extends ResponseUserDto {
  achievements: number[];
  rankScore: number;
}

export async function toDetailResponseUserDto(
  user: User,
  achievements: number[],
  rankScore: number,
): Promise<DetailResponseUserDto> {
  return {
    ...toResponseUserDto(user),
    achievements: achievements,
    rankScore: rankScore,
  };
}
