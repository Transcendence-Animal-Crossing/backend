import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FollowService } from './follow.service';

@Controller('follow')
@UseGuards(JwtAuthGuard)
export class FollowController {
  constructor(private followService: FollowService) {}

  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  async createRequest(@Body('sendTo') id: number, @Req() req) {
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

  @Delete('follow')
  @HttpCode(HttpStatus.OK)
  async deleteFollow(@Body('sendTo') id: number, @Req() req) {
    console.log('send byid', req.user.id);
    await this.followService.deleteFollow(req.user.id, id);
  }
}
