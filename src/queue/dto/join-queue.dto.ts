import { IsString } from 'class-validator';
import { GameType } from '../../game/const/game.type';

export class JoinQueueDto {
  @IsString()
  readonly type: GameType;
}
