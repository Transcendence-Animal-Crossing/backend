import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomService } from './room.service';
import { UserModule } from '../user/user.module';
import { User } from '../user/entities/user.entity';
import { RoomRepository } from './room.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User]), UserModule],
  providers: [RoomService, RoomRepository],
  exports: [RoomService],
})
export class RoomModule {}
