import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameService } from './game.service';
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
  providers: [GameService, GameRepository],
  controllers: [GameController],
  exports: [GameService, GameRepository],
})
export class GameModule {}
