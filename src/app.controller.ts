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

  @Get('/')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/user')
  getUsers() {
    return this.userService.findAll();
  }

  @Public()
  @Get('/login')
  @Render('login')
  login() {}

  @Get('/index')
  @Render('index')
  root() {
    return { message: 'Hello world!' };
  }

  @Get('/dm')
  @Render('dm')
  dm(@Req() req) {
    return { userId: req.user.id };
  }

  @Get('/chat/rooms')
  @Render('rooms')
  rooms() {
    return { rooms: this.roomService.findAll() };
  }

  @Get('/chat/:id')
  @Render('room')
  room(@Param('id') id: string) {
    return { roomId: id };
  }

  @Get('/chat')
  @Render('chat')
  chat(@Req() req, @Query('token') token: string) {
    return { userId: req.user.id, token: token };
  }
}
