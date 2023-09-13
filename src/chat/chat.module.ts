import { Module } from '@nestjs/common';

import { ChatGateway } from './chat.gateway';

// import { GameModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from "../user/user.module";
// import { RoomModule } from 'src/room/room.module';

@Module({
  // imports: [GameModule, AuthModule, RoomModule],
  imports: [AuthModule, UserModule],
  providers: [ChatGateway],
})
export class ChatModule {}
