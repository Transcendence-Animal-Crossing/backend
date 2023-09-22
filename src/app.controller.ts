import { Controller, Get, Param, Render } from "@nestjs/common";
import { AppService } from './app.service';
import { RoomService } from './room/room.service';
import { UserService } from "./user/user.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly roomService: RoomService, private readonly userService: UserService) {}

  @Get('/')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/user')
  getUsers() {
    return this.userService.findAll();
  }

  @Get('/index')
  @Render('index')
  root() {
    return { message: 'Hello world!' };
  }

  @Get('/chat')
  @Render('chat')
  chat() {
    return { message: 'Hello world!' };
  }

  @Get('/chat/rooms')
  @Render('rooms')
  rooms() {
    return { rooms: this.roomService.findAll() };
  }

  @Get('/chat/:id')
  @Render('room')
  room(@Param('id') id: number) {
    return { roomId: id };
  }
}
