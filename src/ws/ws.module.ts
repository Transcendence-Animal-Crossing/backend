import { forwardRef, Module } from '@nestjs/common';
import { ClientRepository } from './client.repository';
import { ClientService } from './client.service';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { RoomModule } from '../room/room.module';

@Module({
  imports: [AuthModule, UserModule, forwardRef(() => RoomModule)],
  providers: [ClientRepository, ClientService],
  exports: [ClientRepository, ClientService],
})
export class WSModule {}
