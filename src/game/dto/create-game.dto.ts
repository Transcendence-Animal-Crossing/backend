import { IsBoolean, IsNumber } from 'class-validator';

export class CreateGameDto {
  @IsNumber()
  winnerScore: number;

  @IsNumber()
  loserScore: number;

  @IsNumber()
  playTime: number;

  @IsNumber()
  winnerId: number;

  @IsNumber()
  loserId: number;

  @IsBoolean()
  isRank: boolean;
}
