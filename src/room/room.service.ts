import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { Room } from './model/room.model';
import { ConfigRoomDto } from './dto/config-room.dto';
import { ActionRoomDto } from '../chat/dto/action-room.dto';
import { Grade } from './enum/user.grade.enum';
import { UserProfile } from '../user/model/user.profile.model';
import { RoomUser } from './model/room-user.model';
import { Socket } from 'socket.io';
import { JoinRoomDto } from '../chat/dto/join-room.dto';
import { RoomMessageDto } from '../chat/dto/room-message.dto';
import { Namespace } from '../ws/const/namespace';
import { ClientRepository } from '../ws/client.repository';
import { AchievementService } from 'src/achievement/achievement.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class RoomService {
  private readonly logger: Logger = new Logger(RoomService.name);

  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(RoomUser)
    private readonly roomUserRepository: Repository<RoomUser>,
    private readonly userService: UserService,
    private readonly clientRepository: ClientRepository,
    private readonly achievementService: AchievementService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findRoomByCursor(cursor: number): Promise<Room[]> {
    return await this.roomRepository.find({
      order: {
        id: 'DESC',
      },
      take: 20,
      skip: cursor,
    });
  }

  async findById(id: number): Promise<Room> {
    return await this.roomRepository.findOneBy({ id: id });
  }

  async getJoinedRooms(userId: number) {
    return await this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.room_user', 'room_user')
      .where('room_user.id = :userId', { userId: userId })
      .getMany();
  }

  async joinRoom(server, client: Socket, dto: JoinRoomDto) {
    // 방법1: participantRepository
    const data1 = await this.roomUserRepository
      .createQueryBuilder('room_user')
      .leftJoinAndSelect('room_user.room', 'room')
      .where('room_user.id = :userId and room.id = :roomId', {
        userId: client.data.userId,
        roomId: dto.roomId,
      })
      .getOne();

    // 방법2: roomRepository
    const data2 = await this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.room_user', 'room_user')
      .where('room.id = :roomId', { roomId: dto.roomId })
      .getOne();
    return data2;

    // 일단 보류

    // const room: Room = await this.roomRepository.findOneBy({ id: dto.roomId });
    // if (room.isParticipant(userId))
    //   throw new ConflictException('해당 방에 이미 들어가 있습니다.');
    // if (room.isBanned(userId))
    //   throw new ForbiddenException('해당 방으로의 입장이 금지되었습니다.');
    // if (room.isProtected() && !room.validatePassword(dto.password))
    //   throw new ForbiddenException('비밀번호가 틀렸습니다.');
    // if (room.isPrivate() && !room.isInvited(userId))
    //   throw new UnauthorizedException('해당 방에 초대되지 않았습니다.');
    //
    //   room.participants.push(Participant.of(user, Grade.PARTICIPANT));
    //   await this.roomRepository.update(room);
    // });

    // await this.roomRepository.userJoin(dto.roomId, userId);
    // await this.achievementService.addChattingJoin(user);

    // client.join(dto.roomId);
    // server
    //   .to(dto.roomId)
    //   .emit('room-join', Participant.of(user, Grade.PARTICIPANT));
    // server.to('room-lobby').emit('room-update', SimpleRoomDto.from(room));
    // return room;
  }

  async create(client: Socket, dto: ConfigRoomDto) {
    if (!dto.title) throw new BadRequestException('방 제목을 입력해주세요.');
    const owner = await this.userService.findOne(client.data.userId);
    const room = Room.create(dto.title, dto.mode, dto.password);
    const roomUser = RoomUser.create(Grade.OWNER);
    roomUser.user = owner;
    roomUser.room = room;
    room.roomUsers.push(roomUser);
    await this.roomRepository.save(room);
    await this.roomUserRepository.save(roomUser);

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

    /**
     * TODO1: 채팅금지 상태인지 확인 (Redis)
     * TODO2: 채팅금지 상태가 아니라면 채팅금지 상태로 변경 (Redis)
     * TODO3: RoomMute 이벤트 발생 (EventEmitter)
     * TODO4: 10분 후에 채팅금지라면 room-unmute 이벤트 전송 (Socket), 채팅금지 상태 해제 (Redis)
     */
  }

  async unmute(client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const room = await this.findById(dto.roomId);
    const userGrade = this.getGrade(userId, room);
    const targetGrade = this.getGrade(dto.targetId, room);

    if (userGrade <= targetGrade)
      throw new ForbiddenException('해당 유저를 채팅금지할 권한이 없습니다.');

    /**
     * TODO1: 채팅금지 상태라면 채팅금지 상태 해제 (Redis)
     */
  }

  async kick(client, dto: ActionRoomDto) {
    const userId = client.data.userId;
    const room: Room = await this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.room_user', 'room_user')
      .where('room.id = :roomId', { roomId: dto.roomId })
      .andWhere('room_user.id = :userId or room_user.id = :targetId', {
        userId: userId,
        targetId: dto.targetId,
      })
      .getOne();

    console.log(room);
    /**
     * TODO1: 해당 유저들이 방에 있는지 확인
     * TODO2: 해당 유저들의 권환 확인
     * TODO3: 타겟 유저를 방에서 제거
     */

    // const room = await this.findById(dto.roomId);
    // const userGrade = this.getGrade(userId, room);
    // const targetGrade = this.getGrade(dto.targetId, room);
    //
    // if (userGrade <= targetGrade)
    //   throw new ForbiddenException('해당 유저를 강퇴할 권한이 없습니다.');
    //
    // room.leaveUser(dto.targetId);
    // await this.roomRepository.update(room);
    // await this.roomRepository.userLeave(dto.targetId);
  }

  async ban(client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const room = await this.findById(dto.roomId);
    const userGrade = this.getGrade(userId, room);
    const targetGrade = this.getGrade(dto.targetId, room);

    if (userGrade <= targetGrade)
      throw new ForbiddenException('해당 유저를 밴할 권한이 없습니다.');

    // const target = room.leaveUser(dto.targetId)[0];
    // room.bannedUsers.push(UserProfile.fromParticipant(target));
    //
    // await this.roomRepository.userLeave(dto.targetId);
    // await this.roomRepository.update(room);
  }

  async unban(client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);

    const room = await this.findById(dto.roomId);
    const userGrade = this.getGrade(userId, room);

    if (userGrade < Grade.ADMIN)
      throw new ForbiddenException('해당 유저를 밴해제 할 권한이 없습니다.');

    // room.unbanUser(dto.targetId);
    // await this.roomRepository.update(room);
  }

  async leave(client: Socket, userId: number) {
    // leave에 roomId가 필요함. 하나의 유저가 여러 개의 방에 입장할 수 있기 때문
    // change-owner 이벤트를 발생시켜서 다른 웹소켓 서버에도 전달해야함
    /**
    const roomId = await this.roomRepository.findRoomIdByUserId(userId);
    if (!roomId) return;
    const room = await this.roomRepository.find(roomId);
    if (!room) return;
    if (!room.isParticipant(userId))
      throw new BadRequestException('방 안에 있지 않습니다.');
    if (room.participants.length === 1) {
      client.leave(room.id);
      await this.roomRepository.userLeave(userId);
      this.eventEmitter.emit('delete.room', room.id);
      await this.roomRepository.delete(room.id);
      return;
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
      **/
  }

  getGrade(userId: number, room: Room): number {
    // const grade = room.findUserGrade(userId);
    // if (grade !== null) return grade;
    // throw new BadRequestException('해당 유저가 방에 없습니다.');
    return 0;
  }

  async addAdmin(client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const room = await this.findById(dto.roomId);
    if (this.getGrade(userId, room) !== Grade.OWNER)
      throw new ForbiddenException('방장만이 관리자를 추가할 수 있습니다.');
    if (this.getGrade(dto.targetId, room) > Grade.PARTICIPANT)
      throw new ConflictException('해당 유저는 이미 관리자입니다.');

    // room.promoteUser(dto.targetId);
    // await this.roomRepository.update(room);
  }

  async removeAdmin(client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const room = await this.findById(dto.roomId);
    if (this.getGrade(userId, room) !== Grade.OWNER)
      throw new ForbiddenException('방장만이 관리자를 회수할 수 있습니다.');
    if (this.getGrade(dto.targetId, room) != Grade.ADMIN)
      throw new ConflictException(
        '해당 유저는 방장이거나, 관리자가 아닙니다.',
      );

    // room.demoteUser(dto.targetId);
    // room.sortParticipants();
    // await this.roomRepository.update(room);
  }

  async invite(client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const room = await this.findById(dto.roomId);
    // if (!room.isParticipant(userId))
    //   throw new ForbiddenException('해당 방에 참여하고 있지 않습니다.');
    // if (room.isParticipant(dto.targetId))
    //   throw new ConflictException('해당 유저는 이미 방에 있습니다.');
    // // if (room.isInvited(dto.targetId))
    // //   throw new ConflictException('해당 유저는 이미 초대되었습니다.');
    //
    // const target = await this.userService.findOne(dto.targetId);
    // room.inviteUser(target);
    // await this.roomRepository.update(room);
    //
    // const invitedClientId = await this.clientRepository.findClientId(
    //   Namespace.CHAT,
    //   dto.targetId,
    // );
    // const user = await this.userService.findOne(userId);
    // if (invitedClientId)
    //   client.to(invitedClientId).emit('room-invite', {
    //     id: room.id,
    //     title: room.title,
    //     sendBy: UserProfile.fromUser(user),
    //   });

    return room;
  }

  async sendMessage(client: Socket, roomMessageDto: RoomMessageDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    roomMessageDto.senderId = userId;

    // const room = await this.findById(roomMessageDto.roomId);
    // if (!room.isParticipant(userId))
    //   throw new ForbiddenException('해당 방에 참여하고 있지 않습니다.');
    // if (room.isMuted(userId))
    //   throw new ForbiddenException(`채팅이 금지상태입니다.`);
    // client
    //   .to(roomMessageDto.roomId)
    //   .except('block-' + userId)
    //   .emit('room-message', roomMessageDto);
    // client.emit('room-message', roomMessageDto);
  }

  async changeMode(client: Socket, mode: string, password: string) {
    const userId = client.data.userId;
    // const roomId = await this.roomRepository.findRoomIdByUserId(userId);
    //
    // const room = await this.findById(roomId);
    // if (!room) throw new BadRequestException('방에 참여하고 있지 않습니다.');
    // const userGrade = this.getGrade(userId, room);
    // if (userGrade !== Grade.OWNER)
    //   throw new ForbiddenException('방장만이 모드를 변경할 수 있습니다.');
    //
    // room.mode = mode;
    // if (mode === 'PROTECTED') room.password = password;
    // await this.roomRepository.update(room);
  }
}
