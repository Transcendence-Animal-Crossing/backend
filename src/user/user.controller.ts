import {
  Body,
  Controller,
  Get,
  HttpCode,
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
import { Public } from 'src/auth/guards/public';
import { RoomService } from 'src/room/room.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly followService: FollowService,
    private readonly roomService: RoomService,
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

  @Public()
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
    await this.roomService.changeUserProfile(
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
    await this.roomService.changeUserProfile(req.user.id, nickName, avatar);
    return { filepath: 'original/' + avatar };
  }

  @Post('nickname')
  @HttpCode(HttpStatus.OK)
  async checkNickName(@Body('nickName') nickName: string, @Req() req) {
    await this.userService.checkNickName(req.user.id, nickName);
    return '닉네임 사용 가능';
  }

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  async updatePassword(@Body('password') password: string, @Req() req) {
    await this.userService.updatePassword(req.user.id, password);
    return '패스워드 설정 햇뜸';
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
  @HttpCode(HttpStatus.OK)
  async searchUser(@Body('name') name: string, @Body('offset') offset: number) {
    return await this.userService.searchUser(name, offset);
  }

  @Patch('block')
  @HttpCode(HttpStatus.OK)
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
  @HttpCode(HttpStatus.OK)
  async unblockUser(@Body('id') id: number, @Req() req) {
    if (req.user.id != id) {
      const user = await this.userService.findOne(req.user.id);
      await this.userService.unblockUser(user, id);
    } else {
      throw new HttpException(
        '자기 자신은 차단 해제 불가 ',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
