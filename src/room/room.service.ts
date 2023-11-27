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
import { Room } from './model/room.model';
import { User } from '../user/entities/user.entity';
import { RoomRepository } from './room.repository';
import { ConfigRoomDto } from './dto/config-room.dto';
import { ActionRoomDto } from '../chat/dto/action-room.dto';
import { Grade } from './enum/user.grade.enum';
import { SimpleRoomDto } from './dto/simple.room.dto';
import { UserProfile } from '../user/model/user.profile.model';
import { Participant } from './model/participant.model';
import { Socket } from 'socket.io';
import { JoinRoomDto } from '../chat/dto/join-room.dto';
import { RoomMessageDto } from '../chat/dto/room-message.dto';
import { Namespace } from '../ws/const/namespace';
import { ClientRepository } from '../ws/client.repository';
import { AchievementService } from 'src/achievement/achievement.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MutexManager } from '../mutex/mutex.manager';

@Injectable()
export class RoomService {
  private readonly logger: Logger = new Logger(RoomService.name);

  constructor(
    private readonly mutexManager: MutexManager,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly roomRepository: RoomRepository,
    private readonly userService: UserService,
    private readonly clientRepository: ClientRepository,
    private readonly achievementService: AchievementService,
    private readonly eventEmitter: EventEmitter2,
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

  async getJoinedRoom(userId: number) {
    const roomId = await this.roomRepository.findRoomIdByUserId(userId);
    if (roomId) return await this.findById(roomId);
    return null;
  }

  async joinRoom(server, client: Socket, dto: JoinRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const user = await this.userService.findOne(userId);
    let room: Room;
    await this.mutexManager.getMutex(dto.roomId).runExclusive(async () => {
      room = await this.findById(dto.roomId);

      if (room.isParticipant(userId))
        throw new ConflictException('해당 방에 이미 들어가 있습니다.');
      if (room.isBanned(userId))
        throw new ForbiddenException('해당 방으로의 입장이 금지되었습니다.');
      if (room.isProtected() && !room.validatePassword(dto.password))
        throw new ForbiddenException('비밀번호가 틀렸습니다.');
      if (room.isPrivate() && !room.isInvited(userId))
        throw new UnauthorizedException('해당 방에 초대되지 않았습니다.');

      room.participants.push(Participant.of(user, Grade.PARTICIPANT));
      await this.roomRepository.update(room);
    });

    await this.roomRepository.userJoin(dto.roomId, userId);
    await this.achievementService.addChattingJoin(user);

    client.join(dto.roomId);
    server
      .to(dto.roomId)
      .emit('room-join', Participant.of(user, Grade.PARTICIPANT));
    server.to('room-lobby').emit('room-update', SimpleRoomDto.from(room));
    return room;
  }

  async create(server, client: Socket, dto: ConfigRoomDto) {
    const ownerId = await this.clientRepository.findUserId(client.id);
    const owner = await this.userService.findOne(ownerId);
    const room = Room.create(dto.title, owner, dto.mode, dto.password);

    client.join(room.id);
    await this.roomRepository.userJoin(room.id, ownerId);
    server.to('room-lobby').emit('room-create', SimpleRoomDto.from(room));

    await this.roomRepository.save(room);
    return room;
  }

  async mute(server, client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    await this.mutexManager.getMutex(dto.roomId).runExclusive(async () => {
      const room = await this.findById(dto.roomId);
      const userGrade = this.getGrade(userId, room);
      const targetGrade = this.getGrade(dto.targetId, room);

      if (userGrade <= targetGrade)
        throw new ForbiddenException('해당 유저를 채팅금지할 권한이 없습니다.');
      if (room.isMuted(dto.targetId))
        throw new ConflictException('해당 유저는 이미 채팅금지 상태입니다.');

      room.muteUser(dto.targetId);
      await this.roomRepository.update(room);
      const timerId: NodeJS.Timeout = setTimeout(async () => {
        server.to(dto.roomId).emit('room-unmute', {
          id: dto.targetId,
        });
        const room: Room = await this.findById(dto.roomId);
        room.unmuteUser(dto.targetId);
        await this.roomRepository.update(room);
      }, 10000);
      await this.roomRepository.saveMuteTimerId(dto.targetId, timerId);
      server.to(dto.roomId).emit('room-mute', dto);
      return;
    });
  }

  async unmute(server, client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const room = await this.findById(dto.roomId);
    const userGrade = this.getGrade(userId, room);
    const targetGrade = this.getGrade(dto.targetId, room);

    if (userGrade <= targetGrade)
      throw new ForbiddenException('해당 유저를 채팅금지할 권한이 없습니다.');

    room.unmuteUser(dto.targetId);
    await this.roomRepository.update(room);
    const timerId = await this.roomRepository.findMuteTimerId(dto.targetId);
    if (timerId) clearTimeout(timerId);
    server.to(dto.roomId).emit('room-unmute', dto);
    return;
  }

  async kick(server, client, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const room = await this.findById(dto.roomId);
    const userGrade = this.getGrade(userId, room);
    const targetGrade = this.getGrade(dto.targetId, room);

    if (userGrade <= targetGrade)
      throw new ForbiddenException('해당 유저를 강퇴할 권한이 없습니다.');

    room.leaveUser(dto.targetId);
    await this.roomRepository.update(room);
    await this.roomRepository.userLeave(dto.targetId);

    server.to(dto.roomId).emit('room-kick', dto);
    const kickedClientId = await this.clientRepository.findClientId(
      Namespace.CHAT,
      dto.targetId,
    );
    if (kickedClientId) server.sockets[kickedClientId].leave(dto.roomId);
  }

  async ban(server, client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const room = await this.findById(dto.roomId);
    const userGrade = this.getGrade(userId, room);
    const targetGrade = this.getGrade(dto.targetId, room);

    if (userGrade <= targetGrade)
      throw new ForbiddenException('해당 유저를 밴할 권한이 없습니다.');

    const target = room.leaveUser(dto.targetId)[0];
    room.bannedUsers.push(UserProfile.fromParticipant(target));

    await this.roomRepository.userLeave(dto.targetId);
    await this.roomRepository.update(room);
    server.to(dto.roomId).emit('room-ban', dto);
    const bannedClientId = await this.clientRepository.findClientId(
      Namespace.CHAT,
      dto.targetId,
    );
    if (bannedClientId) server.sockets[bannedClientId].leave(dto.roomId);
  }

  async unban(server, client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const room = await this.findById(dto.roomId);
    const userGrade = this.getGrade(userId, room);

    if (userGrade < Grade.ADMIN)
      throw new ForbiddenException('해당 유저를 밴해제 할 권한이 없습니다.');

    room.bannedUsers = room.bannedUsers.filter(
      (bannedUser) => bannedUser.id !== dto.targetId,
    );
    await this.roomRepository.update(room);
    server.to(dto.roomId).emit('room-unban', dto);
  }

  async leave(server, client: Socket) {
    const userId = await this.clientRepository.findUserId(client.id);
    const room = await this.getJoinedRoom(userId);
    if (!room) return;
    if (!room.isParticipant(userId))
      throw new BadRequestException('방 안에 있지 않습니다.');
    if (room.participants.length === 1) {
      client.leave(room.id);
      await this.roomRepository.userLeave(userId);
      this.eventEmitter.emit('delete.room', room.id);
      return await this.roomRepository.delete(room.id);
    }
    if (this.getGrade(userId, room) === Grade.OWNER) {
      room.participants[1].grade = Grade.OWNER;
      server.emit('change-owner', {
        id: room.participants[1].id,
      });
    }

    room.leaveUser(userId);
    await this.roomRepository.update(room);
    await this.roomRepository.userLeave(userId);

    client.leave(room.id);
    // userId 만 전송하도록 바꾸고 싶음
    const user = await this.userService.findOne(userId);
    server.to(room.id).emit('room-leave', UserProfile.fromUser(user));
    server.to('room-lobby').emit('room-update', SimpleRoomDto.from(room));
  }

  getGrade(userId: number, room: Room): number {
    const grade = room.findUserGrade(userId);
    if (grade !== null) return grade;
    throw new BadRequestException('해당 유저가 방에 없습니다.');
  }

  async addAdmin(server, client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const room = await this.findById(dto.roomId);
    if (this.getGrade(userId, room) !== Grade.OWNER)
      throw new ForbiddenException('방장만이 관리자를 추가할 수 있습니다.');
    if (this.getGrade(dto.targetId, room) > Grade.PARTICIPANT)
      throw new ConflictException('해당 유저는 이미 관리자입니다.');

    room.promoteUser(dto.targetId);
    room.sortParticipants();
    await this.roomRepository.update(room);
    server.to(dto.roomId).emit('add-admin', dto);
  }

  async removeAdmin(server, client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const room = await this.findById(dto.roomId);
    if (this.getGrade(userId, room) !== Grade.OWNER)
      throw new ForbiddenException('방장만이 관리자를 회수할 수 있습니다.');
    if (this.getGrade(dto.targetId, room) != Grade.ADMIN)
      throw new ConflictException('해당 유저는 방장이거나, 관리자가 아닙니다.');

    room.demoteUser(dto.targetId);
    room.sortParticipants();
    await this.roomRepository.update(room);
    server.to(dto.roomId).emit('remove-admin', dto);
  }

  async invite(client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const room = await this.findById(dto.roomId);
    if (!room.isParticipant(userId))
      throw new ForbiddenException('해당 방에 참여하고 있지 않습니다.');
    if (room.isParticipant(dto.targetId))
      throw new ConflictException('해당 유저는 이미 방에 있습니다.');
    if (room.isInvited(dto.targetId))
      throw new ConflictException('해당 유저는 이미 초대되었습니다.');

    const target = await this.userService.findOne(dto.targetId);
    room.inviteUser(target);
    await this.roomRepository.update(room);

    const invitedClientId = await this.clientRepository.findClientId(
      Namespace.CHAT,
      dto.targetId,
    );
    if (invitedClientId)
      client.to(invitedClientId).emit('room-invite', SimpleRoomDto.from(room));

    return room;
  }

  async sendMessage(client: Socket, roomMessageDto: RoomMessageDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    roomMessageDto.senderId = userId;

    const room = await this.findById(roomMessageDto.roomId);
    if (!room.isParticipant(userId))
      throw new ForbiddenException('해당 방에 참여하고 있지 않습니다.');
    if (room.isMuted(userId))
      throw new ForbiddenException(`채팅이 금지상태입니다.`);
    client
      .to(roomMessageDto.roomId)
      .except('block-' + userId)
      .emit('room-message', roomMessageDto);
    client.emit('room-message', roomMessageDto);
  }

  async changeMode(server, client: Socket, mode: string, password: string) {
    const userId = await this.clientRepository.findUserId(client.id);
    const room = await this.getJoinedRoom(userId);
    if (!room) throw new BadRequestException('방에 참여하고 있지 않습니다.');
    const userGrade = this.getGrade(userId, room);
    if (userGrade !== Grade.OWNER)
      throw new ForbiddenException('방장만이 모드를 변경할 수 있습니다.');

    room.mode = mode;

    server.to('room-lobby').emit('room-update', SimpleRoomDto.from(room));
    if (mode === 'PROTECTED') room.password = password;

    server.to(room.id).emit('room-mode', {
      mode: mode,
    });

    await this.roomRepository.update(room);
  }
}
