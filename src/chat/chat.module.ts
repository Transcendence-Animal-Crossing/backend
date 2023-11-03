import { Module } from '@nestjs/common';

import { ChatGateway } from './chat.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from '../user/user.module';
import { RoomModule } from '../room/room.module';
import { ChatService } from './chat.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entity/message.entity';
import { ClientRepository } from '../ws/client.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    AuthModule,
    UserModule,
    RoomModule,
  ],
  providers: [ChatGateway, ChatService, ClientRepository],
  exports: [ChatGateway],
})
export class ChatModule {}
