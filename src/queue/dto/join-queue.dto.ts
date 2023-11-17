import { IsBoolean } from 'class-validator';

export class JoinQueueDto {
  @IsBoolean()
  readonly isRank: boolean;

  @IsBoolean()
  readonly isSpecial: boolean;
}
