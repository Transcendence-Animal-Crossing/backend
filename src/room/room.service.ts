import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { UserService } from 'src/user/user.service';

import { Room } from './entities/room.entity';
import { User } from '../user/entities/user.entity';
import { RoomRepository } from './RoomRepository';

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
