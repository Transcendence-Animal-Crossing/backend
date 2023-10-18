import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ResponseUserDto } from './dto/response-user.dto';
import { Public } from 'src/auth/guards/public';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/config/multer.config';
import { DetailResponseUserDto } from './dto/detailResponse-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}
  private readonly logger: Logger = new Logger('UserController');

  @Get('user')
  findOnyById(@Query('id') id: number){
    return this.userService.findOneById(id);
  }

  @Get('detail')
  findMeDetail(@Query('id') id:number){
    return this.userService.findOneById(id, true);
  }

  @Get('me')
  findMe(@Req() req){
    return this.userService.findOneById(req.user.id);
  }

  @Get('all')
  findAll() {
    return this.userService.findAll();
  }


  @Patch('profile')
  @UseInterceptors(FileInterceptor('avatar', multerOptions))
  async firstSignUp(
    @UploadedFile() file,
    @Body('nickName') nickName: string,
    @Req() req
  ) {
    await this.userService.checkNickName(req.user.id, nickName);
    await this.userService.saveProfileImage(req.user.id, nickName, file.filename);
    return { filepath: 'uploads/' + file.filename };
  }

  @Patch('profileWithUrl')
  async profileWithUrl(
    @Body('nickName') nickName: string,
    @Body('avatar') avatar: string,
    @Req() req
  ) {
    await this.userService.checkNickName(req.user.id, nickName);
    await this.userService.saveUrlImage(req.user.id, nickName, avatar);
    return { filepath: 'original/' + avatar };
  }

  @Get('nicknames/:nickName')
  async checkNickName(@Param('nickName') nickName: string, @Req() req) {
    await this.userService.checkNickName(req.user.id, nickName);
    return 'you can use this nickname';
  }

  @Patch('password')
  async updatePassword(@Body('password')password:string, @Req() req) {
    await this.userService.updatePassword(req.user.id, password);
    return 'success';
  }

  @Patch('achievement')
  async updateAchievements(
    @Body('intraName') intraName: string,
    @Body('achievement') achievement: string,
  ) {
    await this.userService.updateAchievements(intraName, achievement);
    return 'success';
  }
}
