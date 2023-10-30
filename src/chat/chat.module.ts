import { Module } from '@nestjs/common';

import { ChatGateway } from './chat.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from '../user/user.module';
import { RoomModule } from '../room/room.module';
import { MessageService } from './message.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entity/message.entity';
import { ClientRepository } from './client.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    AuthModule,
    UserModule,
    RoomModule,
  ],
  providers: [ChatGateway, MessageService, ClientRepository],
  exports: [ChatGateway],
})
export class ChatModule {}
