import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
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
import { UserData } from './data/user.data';
import { ParticipantData } from './data/participant.data';
import { Socket } from 'socket.io';
import { ClientRepository } from '../chat/client.repository';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly roomRepository: RoomRepository,
    private readonly clientRepository: ClientRepository,
    private readonly userService: UserService,
  ) {}

  @WebSocketServer()
  server;

  async findNotPrivateRooms() {
    const rooms = await this.roomRepository.findAll();
    const roomList = [];
    for (const room of rooms) {
      if (room.mode === 'PRIVATE') continue;
      roomList.push(new SimpleRoomDto(room));
    }
    return roomList;
  }

  async findById(id: string): Promise<Room> {
    const room = await this.roomRepository.find(id);
    if (!room) throw new NotFoundException(`There is no room under id ${id}`);
    return room;
  }

  async getJoinedRoom(client: Socket) {
    const roomIds = Object.keys(client.rooms).filter((roomId) => {
      !roomId.startsWith('room-');
    });
    if (roomIds.length) return await this.findById(roomIds[0]);
    return null;
  }

  async joinRoom(userId: number, room: Room, password: string) {
    if (this.isParticipant(userId, room))
      throw new ConflictException('해당 방에 이미 들어가 있습니다.');
    if (this.isBanned(userId, room))
      throw new ForbiddenException('해당 방으로의 입장이 금지되었습니다.');
    if (room.mode === 'PROTECTED' && room.password !== password)
      throw new ForbiddenException('비밀번호가 틀렸습니다.');
    if (room.mode === 'PRIVATE' && !this.isInvited(userId, room))
      throw new UnauthorizedException('해당 방에 초대되지 않았습니다.');

    const user = await this.userService.findOne(userId);
    room.participants.push(new ParticipantData(user, 0));
    await this.roomRepository.update(room);
  }

  async create(dto: CreateRoomDto, ownerId: number) {
    const owner = await this.userService.findOne(ownerId);
    const room = new Room(dto.title, owner, dto.mode, dto.password);

    await this.roomRepository.save(room);
    return room;
  }

  async mute(userId: number, dto: ActionRoomDto) {
    const room = await this.findById(dto.roomId);
    const userGrade = this.getGrade(userId, room);
    const targetGrade = this.getGrade(dto.targetId, room);

    if (userGrade <= targetGrade)
      throw new ForbiddenException('해당 유저를 채팅금지할 권한이 없습니다.');

    for (const participant of room.participants) {
      if (participant.id === dto.targetId) {
        participant.mute = true;
        await this.roomRepository.update(room);
        return;
      }
    }
    throw new BadRequestException('해당 유저가 방에 없습니다.');
  }

  async unmute(userId: number, dto: ActionRoomDto) {
    const room = await this.findById(dto.roomId);
    const userGrade = this.getGrade(userId, room);
    const targetGrade = this.getGrade(dto.targetId, room);

    if (userGrade <= targetGrade)
      throw new ForbiddenException('해당 유저를 채팅금지할 권한이 없습니다.');

    for (const participant of room.participants) {
      if (participant.id === dto.targetId) {
        participant.mute = false;
        await this.roomRepository.update(room);
        return;
      }
    }
    throw new BadRequestException('해당 유저가 방에 없습니다.');
  }

  async kick(userId: number, dto: ActionRoomDto) {
    const room = await this.findById(dto.roomId);
    const userGrade = this.getGrade(userId, room);
    const targetGrade = this.getGrade(dto.targetId, room);

    if (userGrade <= targetGrade)
      throw new ForbiddenException('해당 유저를 강퇴할 권한이 없습니다.');

    if (this.isParticipant(dto.targetId, room))
      room.participants = room.participants.filter(
        (participant) => participant.id !== dto.targetId,
      );
    else throw new BadRequestException('해당 유저가 방에 없습니다.');

    await this.roomRepository.update(room);
  }

  async ban(userId: number, dto: ActionRoomDto) {
    const room = await this.findById(dto.roomId);
    const userGrade = this.getGrade(userId, room);
    const targetGrade = this.getGrade(dto.targetId, room);
    let target = null;

    if (userGrade <= targetGrade)
      throw new ForbiddenException('해당 유저를 밴할 권한이 없습니다.');

    if (this.isParticipant(dto.targetId, room)) {
      for (let i = 0; i < room.participants.length; i++) {
        if (room.participants[i].id === dto.targetId) {
          target = room.participants[i];
          room.participants.splice(i, 1);
          break;
        }
      }
    } else throw new BadRequestException('해당 유저가 방에 없습니다.');
    room.bannedUsers.push(new UserData(target));

    await this.roomRepository.update(room);
  }

  async leave(userId: number, room: Room) {
    if (!this.isParticipant(userId, room))
      throw new BadRequestException('방 안에 있지 않습니다.');
    if (room.participants.length === 1)
      return await this.roomRepository.delete(room.id);
    if (this.getGrade(userId, room) === Grade.OWNER) {
      room.participants[1].grade = Grade.OWNER;
      this.server.emit('change-owner', {
        id: room.participants[1].id,
      });
    }

    room.participants = room.participants.filter(
      (participant) => participant.id !== userId,
    );
    await this.roomRepository.update(room);
  }

  isParticipant(userId: number, room: Room) {
    for (const participant of room.participants)
      if (participant.id === userId) return true;
    return false;
  }

  isBanned(userId: number, room: Room) {
    for (const bannedUser of room.bannedUsers)
      if (bannedUser.id === userId) return true;
    return false;
  }

  isInvited(userId: number, room: Room) {
    for (const invitedUser of room.invitedUsers)
      if (invitedUser.id === userId) return true;
    return false;
  }

  getGrade(userId: number, room: Room): number {
    for (const participant of room.participants)
      if (participant.id === userId) return participant.grade;
    throw new BadRequestException('해당 유저가 방에 없습니다.');
  }

  async addAdmin(userId: number, dto: ActionRoomDto) {
    const room = await this.findById(dto.roomId);
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
    this.sortParticipants(room);
    await this.roomRepository.save(room);
  }

  async removeAdmin(userId: number, dto: ActionRoomDto) {
    const room = await this.findById(dto.roomId);
    if (this.getGrade(userId, room) !== Grade.OWNER)
      throw new ForbiddenException('방장만이 관리자를 회수할 수 있습니다.');
    if (this.getGrade(dto.targetId, room) != Grade.ADMIN)
      throw new ConflictException('해당 유저는 방장이거나, 관리자가 아닙니다.');

    for (const participant of room.participants) {
      if (participant.id === dto.targetId) {
        participant.grade = Grade.PARTICIPANT;
        break;
      }
    }
    this.sortParticipants(room);
    await this.roomRepository.save(room);
  }

  async invite(userId: number, dto: ActionRoomDto) {
    const room = await this.findById(dto.roomId);
    if (!this.isParticipant(userId, room))
      throw new ForbiddenException('해당 방에 참여하고 있지 않습니다.');
    if (this.isParticipant(dto.targetId, room))
      throw new ConflictException('해당 유저는 이미 방에 있습니다.');
    if (this.isInvited(dto.targetId, room))
      throw new ConflictException('해당 유저는 이미 초대되었습니다.');

    const target = await this.userService.findOne(dto.targetId);
    room.invitedUsers.push(new UserData(target));
    await this.roomRepository.save(room);

    return room;
  }

  async changeUserProfile(user: User, nickName: string, image: string) {
    const clientId = await this.clientRepository.findClientId(user.id);
    // 없으면 findClientId가 에러를 던지고 .catch로 잡는건 어떨까?
    const client = this.server.sockets.sockets[clientId];
    const room = await this.getJoinedRoom(client);

    if (!room) return;
    for (const participant of room.participants) {
      if (participant.id === user.id) {
        participant.nickName = nickName;
        participant.avatar = image;
        break;
      }
    }
    this.server.emit('user-update', {
      id: user.id,
      nickName: nickName,
      image: image,
    });
    await this.roomRepository.update(room);
  }

  sortParticipants(room: Room) {
    room.participants.sort((a, b) => {
      if (a.grade > b.grade) return -1;
      else if (a.grade < b.grade) return 1;
      else {
        if (a.grade === Grade.ADMIN) {
          if (a.adminTime > b.adminTime) return -1;
          else if (a.adminTime < b.adminTime) return 1;
          else return 0;
        } else {
          if (a.joinTime > b.joinTime) return -1;
          else if (a.joinTime < b.joinTime) return 1;
          else return 0;
        }
      }
    });
    console.log('Sorted participants: ', room.participants);
  }
}
