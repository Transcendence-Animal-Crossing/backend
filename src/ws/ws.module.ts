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
import { EventListener } from './event.listener';
import { ChatModule } from '../chat/chat.module';
import { User } from '../user/entities/user.entity';
import { GameModule } from '../game/game.module';
import { Follow } from '../folllow/entities/follow.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Message, MessageHistory, Follow]),
    AuthModule,
    forwardRef(() => UserModule),
    forwardRef(() => RoomModule),
    FollowModule,
    forwardRef(() => ChatModule),
    forwardRef(() => GameModule),
  ],
  providers: [ClientRepository, ClientService, EventListener],
  exports: [ClientRepository, ClientService],
})
export class WSModule {}
