import { IsNumber, IsString } from 'class-validator';
import { GameType } from '../const/game.type';

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

  @IsString()
  type: GameType;
}
