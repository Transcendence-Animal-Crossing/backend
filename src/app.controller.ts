import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  Render,
  Req,
} from '@nestjs/common';
import { AppService } from './app.service';
import { RoomService } from './room/room.service';
import { UserService } from './user/user.service';
import { Public } from './auth/guards/public';
import { AuthService } from './auth/auth.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly roomService: RoomService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  /*
    아래 코드들은 전부 채팅 데모들을 위한 것들로 실제로는 필요 없음.
   */

  @Public()
  @Get('/')
  @Render('index')
  index(@Query('message') message: string) {
    return { message: message };
  }

  @Get('/user')
  getUsers() {
    return this.userService.findAll();
  }

  @Public()
  @Get('/login')
  @Render('login')
  login() {}

  @Public()
  @Get('/chat')
  @Render('chat')
  async chat(@Query('token') token: string) {
    const userId = this.authService.verifyAccessToken(token).id;
    const user = await this.userService.findOne(userId);
    return { user: user, token: token };
  }

  @Public()
  @Get('/me')
  async me(@Req() req) {
    const userId = this.authService.verifyAccessToken(req.cookies.jwt).id;
    return await this.userService.findOne(userId);
  }

  // 가짜 유저의 비밀번호 업데이트 용도
  @Public()
  @Patch('/password')
  async updatePassword(@Req() req, @Body() body) {
    console.log('body', body);
    await this.userService.updatePassword(body.id, body.password);
  }
}
