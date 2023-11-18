import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FollowService } from './follow.service';
import { UserService } from 'src/user/user.service';
import { AchievementService } from 'src/achievement/achievement.service';

@Controller('follow')
@UseGuards(JwtAuthGuard)
export class FollowController {
  constructor(
    private followService: FollowService,
    private readonly userService: UserService,
    private readonly achievementService: AchievementService,
  ) {}

  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  async createRequest(@Body('sendTo') id: number, @Req() req) {
    const user = await this.userService.findOne(req.user.id);
    if (await this.userService.isBlocked(user, id))
      throw new HttpException(
        '차단한 사람은 친구추가 불가',
        HttpStatus.CONFLICT,
      );
    const isFollowed = await this.followService.findFollowWithDeleted(
      req.user.id,
      id,
    ); //이미 친구이면 exception
    if (isFollowed && !isFollowed.deletedAt) {
      throw new HttpException('already friend', HttpStatus.BAD_REQUEST);
    }
    await this.followService.createRequest(req.user.id, id);
    await this.achievementService.getFollowRequestAchievement(user);
  }

  @Delete('request')
  @HttpCode(HttpStatus.OK)
  async deleteRequest(@Body('sendTo') id: number, @Req() req) {
    await this.followService.deleteRequest(req.user.id, id);
  }

  @Delete('request/other')
  @HttpCode(HttpStatus.OK)
  async deleteOtherRequest(@Body('sendBy') id: number, @Req() req) {
    await this.followService.deleteRequest(id, req.user.id);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async deleteFollow(@Body('sendTo') id: number, @Req() req) {
    console.log('send byid', req.user.id);
    await this.followService.deleteFollow(req.user.id, id);
  }

  @Get('request')
  @HttpCode(HttpStatus.OK)
  async getRequest(@Req() req) {
    return await this.followService.findAllSentTo(req.user.id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getFollow(@Req() req) {
    return await this.followService.getSimpleFriends(req.user.id);
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  async getFriendsByName(@Req() req, @Body('name') name: string) {
    return await this.followService.findFriendsByName(req.user.id, name);
  }
}
