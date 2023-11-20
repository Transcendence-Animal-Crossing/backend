import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from './entities/follow.entity';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { FollowRequest } from './entities/follow-request.entity';
import { User } from 'src/user/entities/user.entity';
import { UserModule } from '../user/user.module';
import { AchievementService } from 'src/achievement/achievement.service';

@Module({
  imports: [
    forwardRef(() => UserModule),
    TypeOrmModule.forFeature([Follow, FollowRequest, User]),
  ],
  providers: [FollowService, AchievementService],
  controllers: [FollowController],
  exports: [FollowService, AchievementService],
})
export class FollowModule {}
