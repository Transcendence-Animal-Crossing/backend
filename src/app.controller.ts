import { Controller, Get, Param, Query, Render, Req } from '@nestjs/common';
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
  chat(@Query('token') token: string) {
    return { userId: this.authService.verifyJwt(token).id, token: token };
  }
}
