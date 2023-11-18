import { User } from '../entities/user.entity';
import { ResponseUserDto, toResponseUserDto } from './response-user.dto';

export class DetailResponseUserDto extends ResponseUserDto {
  achievements: string[];
}

export async function toDetailResponseUserDto(
  user: User,
  achievementService,
): Promise<DetailResponseUserDto> {
  const achievements = await achievementService.getAchievementsInOrder(
    user.achievements,
  );
  return {
    ...toResponseUserDto(user),
    achievements: achievements,
  };
}
