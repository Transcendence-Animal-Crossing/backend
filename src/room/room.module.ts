import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomService } from './room.service';
import { UserModule } from '../user/user.module';
import { User } from '../user/entities/user.entity';
import { RoomRepository } from './room.repository';
import { ClientRepository } from '../chat/client.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User]), forwardRef(() => UserModule)],
  providers: [RoomService, RoomRepository, ClientRepository],
  exports: [RoomService],
})
export class RoomModule {}
