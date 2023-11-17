import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Standby } from './entities/standby.entity';
import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';
import { WSModule } from '../ws/ws.module';
import { QueueCron } from './queue.cron';
import { GameModule } from '../game/game.module';

@Module({
  imports: [TypeOrmModule.forFeature([Standby]), WSModule, GameModule],
  providers: [QueueService, QueueGateway, QueueCron],
  exports: [QueueService],
})
export class QueueModule {}
