import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameService } from './game.service';
import { Game } from './entities/game.entity';
import { GameController } from './game.controller';
import { GameRecord } from '../gameRecord/entities/game-record';
import { GameRecordModule } from 'src/gameRecord/game-record.module';
@Module({
  imports: [TypeOrmModule.forFeature([Game, GameRecord]), GameRecordModule],
  providers: [GameService],
  controllers: [GameController],
  exports: [GameService],
})
export class GameModule {}
