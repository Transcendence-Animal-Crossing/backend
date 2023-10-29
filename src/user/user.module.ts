import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserService } from './user.service';

import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { MulterModule } from '@nestjs/platform-express';
import { multerOptions } from 'src/config/multer.config';
import { FollowModule } from 'src/folllow/follow.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    MulterModule.register(multerOptions),
    FollowModule,
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
