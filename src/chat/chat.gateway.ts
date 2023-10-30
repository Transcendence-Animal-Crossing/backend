import {
  ForbiddenException,
  HttpStatus,
  Logger,
  UseFilters,
} from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Socket } from 'socket.io';

import { UserService } from 'src/user/user.service';
import { AuthService } from 'src/auth/auth.service';
import { RoomMessageDto } from './dto/room-message.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { User } from '../user/entities/user.entity';
import { DirectMessageDto } from './dto/direct-message.dto';
import { RoomService } from '../room/room.service';
import { ActionRoomDto } from './dto/action-room.dto';
import { CreateRoomDto } from '../room/dto/create-room.dto';
import { LeaveRoomDto } from './dto/leave-room.dto';
import { WsExceptionFilter } from './WsExceptionFilter';
import { DetailRoomDto } from '../room/dto/detail.room.dto';
import { ParticipantData } from '../room/data/participant.data';
import { UserData } from '../room/data/user.data';
import { MessageService } from './message.service';
import { LoadMessageDto } from './dto/load-message.dto';
import { SimpleRoomDto } from '../room/dto/simple.room.dto';
import { ActionDto } from './dto/action.dto';
import { Room } from '../room/data/room.data';
import { ClientRepository } from './client.repository';

// @UsePipes(new ValidationPipe())
@WebSocketGateway()
@UseFilters(new WsExceptionFilter())
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server;
  private readonly logger: Logger = new Logger('ChatGateway');

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly roomService: RoomService,
    private readonly messageService: MessageService,
    private readonly clientRepository: ClientRepository,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    this.logger.log('WebSocket Connected, clientId: ' + client.id);
    let payload;
    try {
      const token = client.handshake.auth.token;
      this.logger.log('Trying to connect WebSocket... (Token: ' + token + ')');
      payload = this.authService.verifyAccessToken(token);
    } catch (error) {
      client.emit('exception', {
        status: HttpStatus.UNAUTHORIZED,
        message: 'Invalid or Expired Token.',
      });
      client.disconnect(true);
      this.logger.error('error' + error);
      this.logger.error('error.message' + error.message);
      this.logger.log('Invalid or Expired Token: ' + client.id);
      return;
    }
    const user: User = payload && (await this.userService.findOne(payload.id));
    if (!user) {
      client.emit('exception', {
        status: HttpStatus.UNAUTHORIZED,
        message: 'Invalid User.',
      });
      client.disconnect(true);
      this.logger.log('Invalid User: ' + client.id);
      return;
    }
    await this.clientRepository.connect(client.id, user.id);
    client.emit('user-list', await this.getConnectedUsersData());
    for (const blockId of user.blockIds) {
      client.join('block-' + blockId);
    }
    // 친구 기능이 추가되면 아래 코드를 사용
    // for (const follow of follows) {
    //   client.join('follow-' + follow.id);
    // }
    // client.to('follow-' + user.id).emit('follow', new UserData(user));
    this.logger.log('WebSocket Connected!: ' + user.nickName);
  }

  async handleDisconnect(client: Socket) {
    const userId = await this.clientRepository.findUserId(client.id);
    await this.clientRepository.connect(client.id, userId);
    this.logger.log('Websocket Disconnected: ' + client.id + ' ' + userId);
  }

  @SubscribeMessage('room-list')
  async getRoomList() {
    const roomList = await this.roomService.findNotPrivateRooms();
    return { status: HttpStatus.OK, body: roomList };
  }

  // 없어질 함수
  @SubscribeMessage('room-detail')
  async getRoomDetail(client: Socket, roomId: string) {
    const room: Room = await this.roomService.findById(roomId);
    return { status: HttpStatus.OK, body: new DetailRoomDto(room) };
  }

  @SubscribeMessage('room-create')
  async createRoom(client: Socket, dto: CreateRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const room = await this.roomService.create(dto, userId);

    client.join(room.id);
    this.server.emit('room-list', await this.roomService.findNotPrivateRooms());
    // 나중에 아래처럼 변경해야 할까?
    // this.server.to('lobby').emit('room-list', await this.roomService.findAll());
    return { status: HttpStatus.OK, body: new DetailRoomDto(room) };
  }

  @SubscribeMessage('room-join')
  async onRoomJoin(client: Socket, dto: JoinRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const user = await this.userService.findOne(userId);
    const room: Room = await this.roomService.findById(dto.roomId);

    await this.roomService.joinRoom(userId, room, dto.password);

    client.join(dto.roomId);
    this.server.to(dto.roomId).emit('room-join', new ParticipantData(user, 0));
    return { status: HttpStatus.OK, body: new DetailRoomDto(room) };
  }

  @SubscribeMessage('room-leave')
  async onRoomLeave(client: Socket, dto: LeaveRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const user = await this.userService.findOne(userId);
    const room = await this.roomService.findById(dto.roomId);

    await this.roomService.leave(userId, room);
    client.leave(dto.roomId);

    this.server.to(dto.roomId).emit('room-leave', new UserData(user));
    const roomList = await this.roomService.findNotPrivateRooms();
    return { status: HttpStatus.OK, body: roomList };
  }

  @SubscribeMessage('room-invite')
  async onRoomInvite(client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const room = await this.roomService.invite(userId, dto);
    const invitedClient = await this.getClientByUserId(dto.targetId);
    invitedClient.emit('room-invite', new SimpleRoomDto(room));
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('room-mute')
  async onRoomMute(client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);

    await this.roomService.mute(userId, dto);
    this.server.to(dto.roomId).emit('room-mute', dto);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('room-unmute')
  async onRoomUnMute(client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);

    await this.roomService.unmute(userId, dto);
    this.server.to(dto.roomId).emit('room-unmute', dto);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('room-kick')
  async onRoomKick(client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);

    await this.roomService.kick(userId, dto);
    this.server.to(dto.roomId).emit('room-kick', dto);

    const kickedClient = await this.getClientByUserId(dto.targetId);
    kickedClient.leave(dto.roomId);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('room-ban')
  async onRoomBan(client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);

    await this.roomService.ban(userId, dto);
    this.server.to(dto.roomId).emit('room-ban', dto);

    const bannedClient = await this.getClientByUserId(dto.targetId);
    bannedClient.leave(dto.roomId);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('add-admin')
  async addAdmin(client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);

    await this.roomService.addAdmin(userId, dto);
    this.server.to(dto.roomId).emit('add-admin', dto);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('remove-admin')
  async removeAdmin(client: Socket, dto: ActionRoomDto) {
    const userId = await this.clientRepository.findUserId(client.id);

    await this.roomService.removeAdmin(userId, dto);
    this.server.to(dto.roomId).emit('remove-admin', dto);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('room-message')
  async onRoomMessage(client: Socket, roomMessageDto: RoomMessageDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    roomMessageDto.senderId = userId;

    const room = await this.roomService.findById(roomMessageDto.roomId);
    if (!this.roomService.isParticipant(userId, room))
      throw new ForbiddenException('해당 방에 참여하고 있지 않습니다.');

    client
      .to(roomMessageDto.roomId)
      .except('block-' + userId)
      .emit('room-message', roomMessageDto);
    client.emit('room-message', roomMessageDto);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('direct-message')
  async onDirectMessage(client: Socket, dto: DirectMessageDto) {
    dto.senderId = await this.clientRepository.findUserId(client.id);
    const receiver = await this.clientRepository.findClientId(dto.receiverId);
    client
      .to(receiver)
      .except('block-' + dto.senderId)
      .emit('direct-message', dto);
    client.emit('direct-message', dto);
    // const viewed: boolean = await client.emitWithAck('direct-message', dto);
    // await this.messageService.createAndSave(dto, viewed);

    await this.messageService.createAndSave(dto, false);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('message-load')
  async onMessageLoad(client: Socket, loadMessageDto: LoadMessageDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const messages = await this.messageService.loadMessage(
      userId,
      loadMessageDto,
    );
    console.log(messages);
    return { status: HttpStatus.OK, body: messages };
  }

  // 없어질 함수
  @SubscribeMessage('user-list')
  async onUserList(client: Socket) {
    const userId = await this.clientRepository.findUserId(client.id);
    const connectedUsers = await this.clientRepository.connectedUserIds();
    const ids = Array.from(connectedUsers).filter((id) => {
      return id !== userId;
    });
    const users = await this.userService.getUserDataByIds(ids);
    return { status: HttpStatus.OK, body: users };
  }

  @SubscribeMessage('user-block')
  async onUserBlock(client: Socket, dto: ActionDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const user = await this.userService.findOne(userId);
    // 친구라면 친구를 끊는 로직이 추가되어야 함
    await this.userService.block(user, dto.targetId);
    client.join('block-' + dto.targetId);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('user-unblock')
  async onUserUnblock(client: Socket, dto: ActionDto) {
    const userId = await this.clientRepository.findUserId(client.id);
    const user = await this.userService.findOne(userId);

    await this.userService.unblock(user, dto.targetId);
    client.leave('block-' + dto.targetId);
    return { status: HttpStatus.OK };
  }

  private async getConnectedUsersData() {
    const ids = await this.clientRepository.connectedUserIds();
    const connectedUsers = await this.userService.getUserDataByIds(ids);
    connectedUsers.map((user) => {
      user.status = 'ONLINE';
    });
    return connectedUsers;
  }

  private async getClientByUserId(userId: number) {
    const clientId = await this.clientRepository.findClientId(userId);
    if (!clientId) return null;
    return this.server.sockets.sockets.get(clientId);
  }
}
