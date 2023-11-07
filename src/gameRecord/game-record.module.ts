import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameRecord } from './entities/game-record';
import { GameRecordController } from './game-record.controller';
import { GameRecordService } from './game-record.service';

@Module({
  imports: [TypeOrmModule.forFeature([GameRecord])],
  providers: [GameRecordService],
  controllers: [GameRecordController],
  exports: [GameRecordService],
})
export class GameRecordModule {}
