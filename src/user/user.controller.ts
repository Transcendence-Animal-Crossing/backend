import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/config/multer.config';
import { FollowService } from 'src/folllow/follow.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private userService: UserService,
    private readonly followService: FollowService,
  ) {}
  private readonly logger: Logger = new Logger('UserController');

  @Get('user')
  findOnyById(@Query('id') id: number) {
    return this.userService.findOneById(id);
  }

  @Get('detail')
  findMeDetail(@Query('id') id: number) {
    return this.userService.findOneById(id, true);
  }

  @Get('me')
  findMe(@Req() req) {
    return this.userService.findOneById(req.user.id);
  }

  @Get('all')
  findAll() {
    return this.userService.findAll();
  }

  @Patch('profile')
  @UseInterceptors(FileInterceptor('avatar', multerOptions))
  async updateProfile(
    @UploadedFile() file,
    @Body('nickName') nickName: string,
    @Req() req,
  ) {
    await this.userService.checkNickName(req.user.id, nickName);
    await this.userService.saveProfileImage(
      req.user.id,
      nickName,
      file.filename,
    );
    return { filepath: 'uploads/' + file.filename };
  }

  @Patch('profileWithUrl')
  async updateProfileWithUrl(
    @Body('nickName') nickName: string,
    @Body('avatar') avatar: string,
    @Req() req,
  ) {
    await this.userService.checkNickName(req.user.id, nickName);
    await this.userService.saveUrlImage(req.user.id, nickName, avatar);
    return { filepath: 'original/' + avatar };
  }

  @Post('nickname')
  async checkNickName(@Body('nickName') nickName: string, @Req() req) {
    await this.userService.checkNickName(req.user.id, nickName);
    return 'you can use this nickname';
  }

  @Patch('password')
  async updatePassword(@Body('password') password: string, @Req() req) {
    await this.userService.updatePassword(req.user.id, password);
    return 'success';
  }

  //todo : achievement update 고쳐야함
  @Patch('achievement')
  async updateAchievements(
    @Body('intraName') intraName: string,
    @Body('achievement') achievement: string,
  ) {
    await this.userService.updateAchievements(intraName, achievement);
    return 'success';
  }

  @Post('search')
  async searchUser(@Body('name') name: string) {
    const users = await this.userService.searchUser(name);
    return users;
  }

  @Patch('block')
  async blockUser(@Body('id') id: number, @Req() req) {
    if (req.user.id != id) {
      await this.userService.blockUser(req.user.id, id);
      const follow = await this.followService.isFollowed(req.user.id, id);
      if (follow && !follow.deletedAt) {
        await this.followService.deleteFollow(req.user.id, id);
      }
    } else {
      throw new HttpException('자기 자신은 차단 불가 ', HttpStatus.BAD_REQUEST);
    }
  }

  @Patch('unblock')
  async unblockUser(@Body('id') id: number, @Req() req) {
    if (req.user.id != id) {
      await this.userService.unblockUser(req.user.id, id);
    } else {
      throw new HttpException(
        '자기 자신은 차단 해제 불가 ',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  @Get('/rank')
  async getRankedUsers() {
    const ranks = this.userService.getRankedUsers();
    return ranks;
  }
}
