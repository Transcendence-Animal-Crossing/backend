import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { RequestWithUser } from './interfaces/request-with-user.interface';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

import { RoomService } from './room.service';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
// import { OwnershipGuard } from './guards/ownership.guard';

@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.roomService.findById(id);
  }

  @Get()
  async find() {
    return this.roomService.findAll();
  }

  @Post()
  async create(
    @Req() req: RequestWithUser,
    @Body('name') name: string, @Body('ownerId') ownerId: number,
  ) {
    return this.roomService.create(name, ownerId);
  }

  // @UseGuards(OwnershipGuard)
  // @Patch(':id')
  // async update(
  //   @Param('id') id: string,
  //   @Req() req: RequestWithUser,
  //   @Body() updateRoomDto: UpdateRoomDto,
  // ) {
  //   return this.roomService.update(id, updateRoomDto);
  // }

  // @UseGuards(JwtAuthGuard, OwnershipGuard)
  // @Delete(':id')
  // async remove(@Param('id') id: string) {
  //   return this.roomService.remove(id);
  // }
}
