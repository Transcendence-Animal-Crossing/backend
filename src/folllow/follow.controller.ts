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

@Controller('follow')
@UseGuards(JwtAuthGuard)
export class FollowController {
  constructor(
    private followService: FollowService,
    private readonly userService: UserService,
  ) {}

  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  async createRequest(@Body('sendTo') id: number, @Req() req) {
    if (await this.userService.isBlocked(req.user.id, id))
      throw new HttpException(
        '차단한 사람은 친구추가 불가',
        HttpStatus.CONFLICT,
      );
    const isFollowed = await this.followService.isFollowed(req.user.id, id); //이미 친구이면 exception
    if (isFollowed && !isFollowed.deletedAt) {
      throw new HttpException('already friend', HttpStatus.BAD_REQUEST);
    }
    return await this.followService.createRequest(req.user.id, id);
  }

  @Delete('request')
  @HttpCode(HttpStatus.OK)
  async deleteRequest(@Body('sendTo') id: number, @Req() req) {
    await this.followService.deleteRequest(req.user.id, id);
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
    return await this.followService.findAllFriends(req.user.id);
  }
}
