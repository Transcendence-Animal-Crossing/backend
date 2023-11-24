import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserService } from './user.service';

import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { MulterModule } from '@nestjs/platform-express';
import { multerOptions } from 'src/config/multer.config';
import { FollowModule } from 'src/folllow/follow.module';
import { GameHistory } from 'src/game/entities/game-history.entity';
import { Room } from 'src/room/data/room.data';
import { GameRecord } from 'src/gameRecord/entities/game-record';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, GameHistory, Room, GameRecord]),
    MulterModule.register(multerOptions),
    forwardRef(() => FollowModule),
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
