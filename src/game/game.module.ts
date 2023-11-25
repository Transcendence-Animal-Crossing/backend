import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameHistoryService } from './game-history.service';
import { GameHistory } from './entities/game-history.entity';
import { GameController } from './game.controller';
import { GameRecord } from '../gameRecord/entities/game-record';
import { GameRecordModule } from 'src/gameRecord/game-record.module';
import { GameRepository } from './game.repository';
@Module({
  imports: [
    TypeOrmModule.forFeature([GameHistory, GameRecord]),
    GameRecordModule,
  ],
  providers: [GameHistoryService, GameRepository],
  controllers: [GameController],
  exports: [GameHistoryService, GameRepository],
})
export class GameModule {}
