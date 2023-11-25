import { IsString } from 'class-validator';
import { GameType } from '../../game/enum/game.type.enum';

export class JoinQueueDto {
  @IsString()
  readonly type: GameType;
}
