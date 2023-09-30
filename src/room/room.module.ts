import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from '@nestjs/typeorm';

import { Room } from './entities/room.entity';
import { Message } from '../chat/entity/message.entity';

import { RoomController } from './room.controller';

import { RoomService } from './room.service';
import { UserModule } from '../user/user.module';
import { User } from "../user/entities/user.entity";
import { RoomRepository } from "./RoomRepository";
import { ChatModule } from "../chat/chat.module";

@Module({
  imports: [TypeOrmModule.forFeature([User]), UserModule],
  controllers: [RoomController],
  providers: [RoomService, RoomRepository],
  exports: [RoomService],
})
export class RoomModule {}
