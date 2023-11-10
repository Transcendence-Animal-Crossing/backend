import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { UserService } from 'src/user/user.service';

import { Room } from './data/room.data';
import { User } from '../user/entities/user.entity';
import { RoomRepository } from './room.repository';
import { ConfigRoomDto } from './dto/config-room.dto';
import { ActionRoomDto } from '../chat/dto/action-room.dto';
import { Grade } from './data/user.grade';
import { SimpleRoomDto } from './dto/simple.room.dto';
import { UserData } from './data/user.data';
import { ParticipantData } from './data/participant.data';
import { Socket } from 'socket.io';
import { ClientRepository } from '../ws/client.repository';
import { JoinRoomDto } from '../chat/dto/join-room.dto';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { RoomMessageDto } from '../chat/dto/room-message.dto';
import { ClientService } from '../ws/client.service';

@WebSocketGateway()
@Injectable()
export class RoomService {
  @WebSocketServer() server;
  SECOND = 1000;
  MUTE_DURATION = 600 * this.SECOND;
  private readonly logger: Logger = new Logger('ChatGateway');

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly roomRepository: RoomRepository,
    private readonly clientRepository: ClientRepository,
    private readonly clientService: ClientService,
    private readonly userService: UserService,
  ) {}

  async joinLobby(client: Socket): Promise<SimpleRoomDto[]> {
    const rooms = await this.roomRepository.findAll();
    const roomList = [];
    for (const room of rooms) {
      if (room.mode === 'PRIVATE') continue;
      roomList.push(SimpleRoomDto.from(room));
    }

    client.join('room-lobby');
    return roomList;
  }

  async findById(id: string): Promise<Room> {
    const room = await this.roomRepository.find(id);
    if (!room)
      throw new NotFoundException(`해당하는 id의 방이 없습니다. id ${id}`);
    return room;
  }

  async getJoinedRoom(client: Socket) {
    const userId = await this.clientRepository.findUserId(client.id);
    const roomId = await this.roomRepository.findRoomIdByUserId(userId);
    if (roomId) return await this.findById(roomId);
    return null;
  }

  async joinRoom(client: Socket, dto: JoinRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const user = await this.userService.findOne(userId);
    const room: Room = await this.findById(dto.roomId);

    if (this.isParticipant(userId, room))
      throw new ConflictException('해당 방에 이미 들어가 있습니다.');
    if (this.isBanned(userId, room))
      throw new ForbiddenException('해당 방으로의 입장이 금지되었습니다.');
    if (room.mode === 'PROTECTED' && room.password !== dto.password)
      throw new ForbiddenException('비밀번호가 틀렸습니다.');
    if (room.mode === 'PRIVATE' && !this.isInvited(userId, room))
      throw new UnauthorizedException('해당 방에 초대되지 않았습니다.');

    await this.roomRepository.userJoin(dto.roomId, userId);
    room.participants.push(ParticipantData.of(user, Grade.PARTICIPANT));
    await this.roomRepository.update(room);

    client.join(dto.roomId);
    this.server
      .to(dto.roomId)
      .emit('room-join', ParticipantData.of(user, Grade.PARTICIPANT));
    this.server.to('room-lobby').emit('room-update', SimpleRoomDto.from(room));
    return room;
  }

  async create(client: Socket, dto: ConfigRoomDto) {
    const ownerId = await this.clientRepository.findUserId(client.id);
    const owner = await this.userService.findOne(ownerId);
    const room = Room.create(dto.title, owner, dto.mode, dto.password);

    client.join(room.id);
    await this.roomRepository.userJoin(room.id, ownerId);
    this.server.to('room-lobby').emit('room-create', SimpleRoomDto.from(room));

    await this.roomRepository.save(room);
    return room;
  }

  async mute(client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const room = await this.findById(dto.roomId);
    const userGrade = this.getGrade(userId, room);
    const targetGrade = this.getGrade(dto.targetId, room);

    if (userGrade <= targetGrade)
      throw new ForbiddenException('해당 유저를 채팅금지할 권한이 없습니다.');
    if (await this.isMuted(dto.targetId, room))
      throw new ConflictException('해당 유저는 이미 채팅금지 상태입니다.');

    for (const participant of room.participants) {
      if (participant.id === dto.targetId) {
        participant.muteStartTime = new Date();
        await this.roomRepository.update(room);

        const timerId = setTimeout(() => {
          this.server.to(dto.roomId).emit('room-unmute', {
            id: dto.targetId,
          });
          this.clientRepository.deleteTimerId(dto.targetId);
        });
        await this.clientRepository.saveTimerId(dto.targetId, timerId);
        this.server.to(dto.roomId).emit('room-mute', dto);
        return;
      }
    }
  }

  async unmute(client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const room = await this.findById(dto.roomId);
    const userGrade = this.getGrade(userId, room);
    const targetGrade = this.getGrade(dto.targetId, room);

    if (userGrade <= targetGrade)
      throw new ForbiddenException('해당 유저를 채팅금지할 권한이 없습니다.');

    for (const participant of room.participants) {
      if (participant.id === dto.targetId) {
        participant.muteStartTime = null;
        await this.roomRepository.update(room);

        const timerId = await this.clientRepository.findTimerId(dto.targetId);
        if (timerId) clearTimeout(timerId);
        this.server.to(dto.roomId).emit('room-unmute', dto);
        return;
      }
    }
  }

  async kick(userId: number, dto: ActionRoomDto) {
    const room = await this.findById(dto.roomId);
    const userGrade = this.getGrade(userId, room);
    const targetGrade = this.getGrade(dto.targetId, room);

    if (userGrade <= targetGrade)
      throw new ForbiddenException('해당 유저를 강퇴할 권한이 없습니다.');

    room.participants = room.participants.filter(
      (participant) => participant.id !== dto.targetId,
    );
    await this.roomRepository.userLeave(dto.targetId);
    await this.roomRepository.update(room);

    this.server.to(dto.roomId).emit('room-kick', dto);
    const kickedClient = await this.clientService.getClientByUserId(
      dto.targetId,
    );
    kickedClient.leave(dto.roomId);
  }

  async ban(client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const room = await this.findById(dto.roomId);
    const userGrade = this.getGrade(userId, room);
    const targetGrade = this.getGrade(dto.targetId, room);
    let target = null;

    if (userGrade <= targetGrade)
      throw new ForbiddenException('해당 유저를 밴할 권한이 없습니다.');

    for (let i = 0; i < room.participants.length; i++) {
      if (room.participants[i].id === dto.targetId) {
        target = room.participants[i];
        room.participants.splice(i, 1);
        break;
      }
    }
    room.bannedUsers.push(UserData.from(target));

    await this.roomRepository.userLeave(dto.targetId);
    await this.roomRepository.update(room);
    this.server.to(dto.roomId).emit('room-ban', dto);
    const bannedClient = await this.clientService.getClientByUserId(
      dto.targetId,
    );
    bannedClient.leave(dto.roomId);
  }

  async unban(client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const room = await this.findById(dto.roomId);
    const userGrade = this.getGrade(userId, room);

    if (userGrade < Grade.ADMIN)
      throw new ForbiddenException('해당 유저를 밴해제 할 권한이 없습니다.');

    room.bannedUsers = room.bannedUsers.filter(
      (bannedUser) => bannedUser.id !== dto.targetId,
    );
    await this.roomRepository.update(room);
    this.server.to(dto.roomId).emit('room-unban', dto);
  }

  async leave(client: Socket, user: User, room: Room) {
    if (!this.isParticipant(user.id, room))
      throw new BadRequestException('방 안에 있지 않습니다.');
    if (room.participants.length === 1)
      return await this.roomRepository.delete(room.id);
    if (this.getGrade(user.id, room) === Grade.OWNER) {
      room.participants[1].grade = Grade.OWNER;
      this.server.emit('change-owner', {
        id: room.participants[1].id,
      });
    }

    room.participants = room.participants.filter(
      (participant) => participant.id !== user.id,
    );
    await this.roomRepository.update(room);
    await this.roomRepository.userLeave(user.id);

    client.leave(room.id);
    this.server.to(room.id).emit('room-leave', UserData.from(user));
    this.server.to('room-lobby').emit('room-update', SimpleRoomDto.from(room));
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

  async addAdmin(client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
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
    await this.roomRepository.update(room);
    this.server.to(dto.roomId).emit('add-admin', dto);
  }

  async removeAdmin(client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
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
    await this.roomRepository.update(room);
    this.server.to(dto.roomId).emit('remove-admin', dto);
  }

  async invite(client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const room = await this.findById(dto.roomId);
    if (!this.isParticipant(userId, room))
      throw new ForbiddenException('해당 방에 참여하고 있지 않습니다.');
    if (this.isParticipant(dto.targetId, room))
      throw new ConflictException('해당 유저는 이미 방에 있습니다.');
    if (this.isInvited(dto.targetId, room))
      throw new ConflictException('해당 유저는 이미 초대되었습니다.');

    const target = await this.userService.findOne(dto.targetId);
    room.invitedUsers.push(UserData.from(target));
    await this.roomRepository.update(room);

    const invitedClient = await this.clientService.getClientByUserId(
      dto.targetId,
    );
    invitedClient.emit('room-invite', SimpleRoomDto.from(room));

    return room;
  }

  async changeUserProfile(user: User, nickName: string, image: string) {
    const clientId = await this.clientRepository.findClientId(user.id);
    if (!clientId) {
      this.logger.log('온라인이 아닌 상태에서의 프로필 변경');
      return;
    }
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
    this.server.to(room.id).emit('user-update', {
      id: user.id,
      nickName: nickName,
      image: image,
    });
    // 유저의 친구들한테도 emit 해주어야 함
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

  async isMuted(userId: number, room: Room) {
    for (const participant of room.participants)
      if (participant.id === userId) {
        if (participant.muteStartTime != null) {
          const now = new Date();
          const muteEndTime = new Date(
            participant.muteStartTime.getTime() + this.MUTE_DURATION,
          );
          if (now < muteEndTime)
            return Math.ceil((muteEndTime.getTime() - now.getTime()) / 1000);
          else {
            participant.muteStartTime = null;
            await this.roomRepository.update(room);
            return 0;
          }
        }
        return 0;
      }
    throw new BadRequestException('해당 유저가 방에 없습니다.');
  }

  async sendMessage(client: Socket, roomMessageDto: RoomMessageDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    roomMessageDto.senderId = userId;

    const room = await this.findById(roomMessageDto.roomId);
    if (!this.isParticipant(userId, room))
      throw new ForbiddenException('해당 방에 참여하고 있지 않습니다.');
    const muteDuration = await this.isMuted(userId, room);
    if (muteDuration > 0)
      throw new ForbiddenException(
        `${muteDuration}초 동안 채팅이 금지되었습니다.`,
      );
    client
      .to(roomMessageDto.roomId)
      .except('block-' + userId)
      .emit('room-message', roomMessageDto);
    client.emit('room-message', roomMessageDto);
  }

  async changeMode(client: Socket, mode: string, password: string) {
    const room = await this.getJoinedRoom(client);
    if (!room) throw new BadRequestException('방에 참여하고 있지 않습니다.');

    const userId = await this.clientRepository.findUserId(client.id);
    const userGrade = this.getGrade(userId, room);
    if (userGrade !== Grade.OWNER)
      throw new ForbiddenException('방장만이 모드를 변경할 수 있습니다.');

    room.mode = mode;
    if (room.mode !== mode)
      this.server
        .to('room-lobby')
        .emit('room-update', SimpleRoomDto.from(room));
    if (mode === 'PROTECTED') room.password = password;

    this.server.to(room.id).emit('room-mode', {
      mode: mode,
    });

    await this.roomRepository.update(room);
  }
}
