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
import { MutexModule } from '../mutex/mutex.module';
import { GameLoopService } from './game-loop.service';
import { GameEventListener } from './game.event.listener';
import { User } from '../user/entities/user.entity';
import { ChatModule } from '../chat/chat.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([GameHistory, GameRecord, User]),
    MutexModule,
    GameRecordModule,
    ChatModule,
    forwardRef(() => WSModule),
  ],
  providers: [
    GameHistoryService,
    GameRepository,
    GameGateway,
    GameService,
    GameLoopService,
    GameEventListener,
  ],
  controllers: [GameController],
  exports: [GameHistoryService, GameRepository, GameGateway, GameService],
})
export class GameModule {}
