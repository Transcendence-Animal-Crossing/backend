import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserService } from './user.service';

import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { MulterModule } from '@nestjs/platform-express';
import { multerOptions } from 'src/config/multer.config';
import { FollowModule } from 'src/folllow/follow.module';
import { Game } from 'src/game/entities/game.entity';
import { Room } from 'src/room/data/room.data';
import { RoomModule } from 'src/room/room.module';
import { GameRecord } from 'src/gameRecord/entities/game-record';
import { Follow } from 'src/folllow/entities/follow.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Game, Room, GameRecord, Follow]),
    MulterModule.register(multerOptions),
    forwardRef(() => FollowModule),
    forwardRef(() => RoomModule),
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
