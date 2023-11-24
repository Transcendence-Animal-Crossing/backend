import { forwardRef, Module } from '@nestjs/common';
import { ClientRepository } from './client.repository';
import { ClientService } from './client.service';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { RoomModule } from '../room/room.module';
import { FollowModule } from '../folllow/follow.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from '../chat/entity/message.entity';
import { MessageHistory } from '../chat/entity/message-history.entity';
import { ClientListener } from './client.listener';
import { ChatModule } from '../chat/chat.module';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Message, MessageHistory]),
    AuthModule,
    forwardRef(() => UserModule),
    forwardRef(() => RoomModule),
    FollowModule,
    forwardRef(() => ChatModule),
  ],
  providers: [ClientRepository, ClientService, ClientListener],
  exports: [ClientRepository, ClientService],
})
export class WSModule {}
