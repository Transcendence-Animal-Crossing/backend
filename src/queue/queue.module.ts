import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Standby } from './entities/standby.entity';
import { QueueService } from './queue.service';
import { QueueGateway } from './queue.gateway';
import { WSModule } from '../ws/ws.module';
import { QueueCron } from './queue.cron';
import { GameModule } from '../game/game.module';
import { GameRecordModule } from '../gameRecord/game-record.module';
import { ChatModule } from '../chat/chat.module';
import { MutexModule } from '../mutex/mutex.module';
import { AchievementService } from '../achievement/achievement.service';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Standby, User]),
    WSModule,
    ChatModule,
    GameModule,
    GameRecordModule,
    MutexModule,
  ],
  providers: [QueueService, QueueGateway, QueueCron, AchievementService],
  exports: [QueueService],
})
export class QueueModule {}
