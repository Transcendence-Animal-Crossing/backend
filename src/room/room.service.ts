import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { UserService } from 'src/user/user.service';

import { Room } from './data/room.data';
import { User } from '../user/entities/user.entity';
import { RoomRepository } from './room.repository';
import { UserDto } from '../user/dto/user.dto';
import { UserData } from './data/user.data';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly roomRepository: RoomRepository,

    private readonly userService: UserService,
  ) {}

  async findAll() {
    return this.roomRepository.findAll();
  }

  findById(id: string) {
    const room = this.roomRepository.find(id);
    if (!room) {
      throw new NotFoundException(`There is no room under id ${id}`);
    }
    return room;
  }

  async getParticipantData(room: Room) {
    const data = [];
    for (let i = 0; i < room.participantIds.length; i++) {
      const user = await this.userService.findOne(room.participantIds[i]);
      data.push(new UserData(user));
    }
    return data;
  }

  joinRoom(userId: number, roomId: string) {
    return this.roomRepository.joinRoom(userId, roomId);
  }

  create(name: string, ownerId: number) {
    const room = new Room(name, ownerId);
    room.participantIds = [ownerId];
    room.adminIds = [ownerId];
    room.bannedIds = [];

    this.roomRepository.save(room);
  }

  kick(targetId: number, roomId: string) {
    this.roomRepository.kickUser(targetId, roomId);
  }

  leave(userId: number, roomId: string) {
    this.roomRepository.leaveUser(userId, roomId);
  }
}
