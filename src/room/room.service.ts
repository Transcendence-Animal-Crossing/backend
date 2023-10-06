import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { UserService } from 'src/user/user.service';

import { Room } from './data/room.data';
import { User } from '../user/entities/user.entity';
import { RoomRepository } from './room.repository';
import { CreateRoomDto } from './dto/create-room.dto';
import { ActionRoomDto } from '../chat/dto/action-room.dto';
import { WebSocketServer } from '@nestjs/websockets';
import { Grade } from './data/user.grade';
import { SimpleRoomDto } from './dto/simple.room.dto';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly roomRepository: RoomRepository,

    private readonly userService: UserService,
  ) {}

  @WebSocketServer()
  server;

  async findAll() {
    const rooms = this.roomRepository.findAll();
    const roomList = [];
    for (const room of rooms) {
      roomList.push(new SimpleRoomDto(room));
    }
    return roomList;
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
    for (const participant of room.participants) data.push(participant);
    return data;
  }

  async joinRoom(userId: number, room: Room) {
    if (this.isParticipant(userId, room))
      throw new ConflictException('해당 방에 이미 들어가 있습니다.');

    const user = await this.userService.findOne(userId);
    this.roomRepository.joinRoom(user, room);
  }

  async create(dto: CreateRoomDto, ownerId: number) {
    const owner = await this.userService.findOne(ownerId);
    const room = new Room(
      dto.title,
      owner,
      dto.isLocked,
      dto.isPrivate,
      dto.password,
    );

    this.roomRepository.save(room);
    return room;
  }

  kick(userId: number, dto: ActionRoomDto) {
    const room = this.findById(dto.roomId);
    const userGrade = this.getGrade(userId, room);
    const targetGrade = this.getGrade(dto.targetId, room);
    console.log('userGrade: ', userGrade);
    console.log('targetGrade: ', targetGrade);
    if (userGrade <= targetGrade)
      throw new ForbiddenException('해당 유저를 강퇴할 권한이 없습니다.');

    if (this.isParticipant(dto.targetId, room))
      room.participants = room.participants.filter(
        (participant) => participant.id !== dto.targetId,
      );
    else throw new BadRequestException('해당 유저가 방에 없습니다.');

    this.roomRepository.update(room);
  }

  leave(userId: number, room: Room) {
    if (!this.isParticipant(userId, room))
      throw new BadRequestException('방 안에 있지 않습니다.');

    room.participants = room.participants.filter(
      (participant) => participant.id !== userId,
    );
    this.roomRepository.update(room);
  }

  isParticipant(userId: number, room: Room) {
    for (const participant of room.participants)
      if (participant.id === userId) return true;
    return false;
  }

  getGrade(userId: number, room: Room): number {
    console.log('getGrade()');
    for (const participant of room.participants)
      if (participant.id === userId) return participant.grade;
    throw new BadRequestException('해당 유저가 방에 없습니다.');
  }

  async addAdmin(userId: number, dto: ActionRoomDto) {
    const room = this.findById(dto.roomId);
    if (this.getGrade(userId, room) !== Grade.OWNER)
      throw new ForbiddenException('방장만이 관리자를 추가할 수 있습니다.');
    if (this.getGrade(dto.targetId, room) > Grade.PARTICIPANT)
      throw new ConflictException('해당 유저는 이미 관리자입니다.');

    for (const participant of room.participants) {
      if (participant.id === dto.targetId) {
        participant.grade = Grade.ADMIN;
        break;
      }
    }
    this.roomRepository.save(room);
  }

  async removeAdmin(userId: number, dto: ActionRoomDto) {
    const room = this.findById(dto.roomId);
    if (this.getGrade(userId, room) !== Grade.OWNER)
      throw new ForbiddenException('방장만이 관리자를 회수할 수 있습니다.');
    if (this.getGrade(dto.targetId, room) != Grade.ADMIN)
      throw new ConflictException('해당 유저는 관리자가 아닙니다.');

    for (const participant of room.participants) {
      if (participant.id === dto.targetId) {
        participant.grade = Grade.PARTICIPANT;
        break;
      }
    }
    this.roomRepository.save(room);
  }
}
