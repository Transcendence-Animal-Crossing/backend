import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Room } from './entities/room.entity';
import { Message } from './entities/message.entity';

import { RoomController } from './room.controller';

import { RoomService } from './room.service';
import { Participant } from './entities/participant.entity';
import { UserModule } from '../user/user.module';
import { User } from "../user/entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, Participant, User, Message]),
    UserModule,
  ],
  controllers: [RoomController],
  providers: [RoomService],
  exports: [RoomService],
})
export class RoomModule {}
