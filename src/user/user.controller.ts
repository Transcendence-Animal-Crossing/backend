import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Res,
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

@Controller('user')
//@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Public()
  @Get('all')
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOnyById(@Param('id') id: number): Promise<ResponseUserDto> {
    return this.userService.findOneById(id);
  }

  @Public()
  @Put('signUp/:id')
  @UseInterceptors(FileInterceptor('avatar', multerOptions))
  async firstSignUp(
    @UploadedFile() file,
    @Param('id') id: number,
    @Body('nickName') nickName: string,
  ) {
    await this.userService.checkNickName(nickName);
    await this.userService.saveProfileImage(id, nickName, file.filename);
    return { filepath: 'uploads/' + file.filename };
  }
  @Public()
  @Put('signUpWithUrl/:id')
  async urlSignUp(
    @Param('id') id: number,
    @Body('nickName') nickName: string,
    @Body('avatar') avatar: string,
  ) {
    await this.userService.checkNickName(nickName);
    await this.userService.saveUrlImage(id, nickName, avatar);
    return { filepath: 'original/' + avatar };
  }

  @Get('nicknames/:nickName')
  async checkNickName(@Param('nickName') nickName: string) {
    await this.userService.checkNickName(nickName);
    return 'you can use this nick name';
  }
}
