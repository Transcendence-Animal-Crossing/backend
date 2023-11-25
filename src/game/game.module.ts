import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistoryService } from './game-history.service';
import { GameHistory } from './entities/game-history.entity';
import { GameController } from './game.controller';
import { GameRecord } from '../gameRecord/entities/game-record';
import { GameRecordModule } from 'src/gameRecord/game-record.module';
import { GameRepository } from './game.repository';
import { GameGateway } from './game.gateway';
import { WSModule } from '../ws/ws.module';
import { GameService } from './game.service';
import { PlayersRepository } from './players.repository';
@Module({
  imports: [
    TypeOrmModule.forFeature([GameHistory, GameRecord]),
    GameRecordModule,
    forwardRef(() => WSModule),
  ],
  providers: [
    GameHistoryService,
    GameRepository,
    PlayersRepository,
    GameGateway,
    GameService,
  ],
  controllers: [GameController],
  exports: [GameHistoryService, GameRepository],
})
export class GameModule {}
