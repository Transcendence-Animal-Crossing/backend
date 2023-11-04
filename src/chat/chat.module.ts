import { Module } from '@nestjs/common';

import { ChatGateway } from './chat.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from '../user/user.module';
import { RoomModule } from '../room/room.module';
import { ChatService } from './chat.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entity/message.entity';
import { WebSocketModule } from '../ws/ws.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    AuthModule,
    UserModule,
    RoomModule,
    WebSocketModule,
  ],
  providers: [ChatGateway, ChatService],
  exports: [],
})
export class ChatModule {}
