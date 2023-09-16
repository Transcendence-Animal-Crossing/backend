import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';
import { RoomService } from './room/room.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly roomService: RoomService) {}

  @Get('/')
  getHello(): string {
    return this.appService.getHello();
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
  room() {
    return { rooms: this.roomService.findAll() };
  }
}
