import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomService } from './room.service';
import { UserModule } from '../user/user.module';
import { User } from '../user/entities/user.entity';
import { RoomRepository } from './room.repository';
import { WSModule } from '../ws/ws.module';
import { ChatModule } from '../chat/chat.module';
import { AchievementService } from 'src/achievement/achievement.service';
import { MutexModule } from '../mutex/mutex.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => UserModule),
    forwardRef(() => WSModule),
    forwardRef(() => ChatModule),
    MutexModule,
  ],
  providers: [RoomService, RoomRepository, AchievementService],
  exports: [RoomService, RoomRepository],
})
export class RoomModule {}
