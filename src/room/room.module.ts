import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomService } from './room.service';
import { UserModule } from '../user/user.module';
import { User } from '../user/entities/user.entity';
import { RoomRepository } from './room.repository';
import { WSModule } from '../ws/ws.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UserModule,
    forwardRef(() => WSModule),
    forwardRef(() => ChatModule),
  ],
  providers: [RoomService, RoomRepository],
  exports: [RoomService],
})
export class RoomModule {}
