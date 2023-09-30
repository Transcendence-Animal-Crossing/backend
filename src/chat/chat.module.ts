import { forwardRef, Module } from "@nestjs/common";

import { ChatGateway } from './chat.gateway';

import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from '../user/user.module';
import { RoomModule } from '../room/room.module';

@Module({
  imports: [AuthModule, UserModule, RoomModule],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
