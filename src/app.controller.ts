import { Controller, Get, Param, Query, Render, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { RoomService } from './room/room.service';
import { UserService } from './user/user.service';
import { Public } from './auth/guards/public';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly roomService: RoomService,
    private readonly userService: UserService,
  ) {}

  @Public()
  @Get('/login')
  @Render('login')
  login() {}

  @Get('/')
  @Render('index')
  root() {
    return { message: 'Hello world!' };
  }

  @Get('/chat')
  @Render('chat')
  chat(@Req() req, @Query('token') token: string) {
    return { userId: req.user.id, token: token };
  }
}
