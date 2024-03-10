import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomService } from './room.service';
import { UserModule } from '../user/user.module';
import { WSModule } from '../ws/ws.module';
import { ChatModule } from '../chat/chat.module';
import { AchievementService } from 'src/achievement/achievement.service';
import { MutexModule } from '../mutex/mutex.module';
import { Room } from './model/room.model';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room]),
    forwardRef(() => UserModule),
    forwardRef(() => WSModule),
    forwardRef(() => ChatModule),
    MutexModule,
  ],
  providers: [RoomService, AchievementService],
  exports: [RoomService],
})
export class RoomModule {}
