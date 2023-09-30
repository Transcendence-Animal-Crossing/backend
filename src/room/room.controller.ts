import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { RoomService } from './room.service';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.roomService.findById(id);
  }

  @Get()
  async find() {
    return this.roomService.findAll();
  }

  @Post()
  async create(@Req() req, @Body('name') name: string) {
    await this.roomService.create(name, req.user.id);
  }
}
