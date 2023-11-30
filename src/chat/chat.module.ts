import { forwardRef, Module } from '@nestjs/common';

import { ChatGateway } from './chat.gateway';
import { UserModule } from '../user/user.module';
import { RoomModule } from '../room/room.module';
import { ChatService } from './chat.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entity/message.entity';
import { WSModule } from '../ws/ws.module';
import { FollowModule } from '../folllow/follow.module';
import { MessageHistory } from './entity/message-history.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, MessageHistory, User]),
    forwardRef(() => FollowModule),
    forwardRef(() => UserModule),
    forwardRef(() => RoomModule),
    forwardRef(() => WSModule),
  ],
  providers: [ChatGateway, ChatService],
  exports: [ChatGateway, ChatService],
})
export class ChatModule {}
