import { ForbiddenException, UseFilters } from '@nestjs/common';
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

// @UsePipes(new ValidationPipe())
@WebSocketGateway()
@UseFilters(new WsExceptionFilter())
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server;

  clientUserMap: Map<string, number> = new Map();
  userClientMap: Map<number, string> = new Map();

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly roomService: RoomService,
    private readonly messageService: MessageService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    console.log('connected: ' + client.id);
    let payload;
    try {
      console.log('client.handshake.auth.token: ', client.handshake.auth.token);
      const token = client.handshake.auth.token;
      payload = this.authService.verifyJwt(token);
    } catch (error) {
      client.emit('exception', {
        status: 401,
        message: 'Invalid or Expired Token.',
      });
      client.disconnect(true);
      return;
    }
    const user: User = payload && (await this.userService.findOne(payload.id));
    if (!user) {
      client.emit('exception', { status: 401, message: 'Invalid User.' });
      client.disconnect(true);
      return;
    }

    this.clientUserMap.set(client.id, user.id);
    this.userClientMap.set(user.id, client.id);

    client.emit('user-list', await this.getConnectedUsersData());
    for (const blockId of user.blockIds) {
      client.join('block-' + blockId);
    }
    // 친구 기능이 추가되면 아래 코드를 사용
    // for (const follow of follows) {
    //   client.join('follow-' + follow.id);
    // }
    // client.to('follow-' + user.id).emit('follow', new UserData(user));
  }

  async handleDisconnect(client: Socket) {
    const userId = this.clientUserMap.get(client.id);
    this.clientUserMap.delete(client.id);
    this.userClientMap.delete(userId);
    console.log('disconnected: ' + client.id + ' ' + userId);
  }

  @SubscribeMessage('room-list')
  async getRoomList(client: Socket) {
    client.emit('room-list', await this.roomService.findNotPrivateRooms());
  }

  @SubscribeMessage('room-detail')
  async getRoomDetail(client: Socket, roomId: string) {
    const room: Room = await this.roomService.findById(roomId);
    client.emit('room-detail', new DetailRoomDto(room));
  }

  @SubscribeMessage('room-create')
  async createRoom(client: Socket, dto: CreateRoomDto) {
    const userId = this.clientUserMap.get(client.id);
    const room = await this.roomService.create(dto, userId);

    client.join(room.id);
    client.emit('room-detail', new DetailRoomDto(room));
    this.server.emit('room-list', await this.roomService.findNotPrivateRooms());
    // 나중에 아래처럼 변경해야 할까?
    // this.server.to('lobby').emit('room-list', await this.roomService.findAll());
  }

  @SubscribeMessage('room-join')
  async onRoomJoin(client: Socket, dto: JoinRoomDto) {
    const userId = this.clientUserMap.get(client.id);
    const user = await this.userService.findOne(userId);
    const room: Room = await this.roomService.findById(dto.roomId);

    await this.roomService.joinRoom(userId, room, dto.password);

    client.join(dto.roomId);
    client.emit('room-detail', new DetailRoomDto(room));
    this.server.to(dto.roomId).emit('room-join', new ParticipantData(user, 0));
  }

  @SubscribeMessage('room-leave')
  async onRoomLeave(client: Socket, dto: LeaveRoomDto) {
    const userId = this.clientUserMap.get(client.id);
    const user = await this.userService.findOne(userId);
    const room = await this.roomService.findById(dto.roomId);

    await this.roomService.leave(userId, room);
    client.leave(dto.roomId);

    this.server.to(dto.roomId).emit('room-leave', new UserData(user));
    this.server.emit('room-list', await this.roomService.findNotPrivateRooms());
    return;
  }

  @SubscribeMessage('room-invite')
  async onRoomInvite(client: Socket, dto: ActionRoomDto) {
    const userId = this.clientUserMap.get(client.id);
    const room = await this.roomService.invite(userId, dto);
    const invitedClient = this.getClientByUserId(dto.targetId);
    invitedClient.emit('room-invite', new SimpleRoomDto(room));
  }

  @SubscribeMessage('room-mute')
  async onRoomMute(client: Socket, dto: ActionRoomDto) {
    const userId = this.clientUserMap.get(client.id);

    await this.roomService.mute(userId, dto);
    this.server.to(dto.roomId).emit('room-mute', dto);
  }

  @SubscribeMessage('room-unmute')
  async onRoomUnMute(client: Socket, dto: ActionRoomDto) {
    const userId = this.clientUserMap.get(client.id);

    await this.roomService.unmute(userId, dto);
    this.server.to(dto.roomId).emit('room-unmute', dto);
  }

  @SubscribeMessage('room-kick')
  async onRoomKick(client: Socket, dto: ActionRoomDto) {
    const userId = this.clientUserMap.get(client.id);

    await this.roomService.kick(userId, dto);
    this.server.to(dto.roomId).emit('room-kick', dto);

    const kickedClient = this.getClientByUserId(dto.targetId);
    kickedClient.leave(dto.roomId);
  }

  @SubscribeMessage('room-ban')
  async onRoomBan(client: Socket, dto: ActionRoomDto) {
    const userId = this.clientUserMap.get(client.id);

    await this.roomService.ban(userId, dto);
    this.server.to(dto.roomId).emit('room-ban', dto);

    const bannedClient = this.getClientByUserId(dto.targetId);
    bannedClient.leave(dto.roomId);
  }

  @SubscribeMessage('add-admin')
  async addAdmin(client: Socket, dto: ActionRoomDto) {
    const userId = this.clientUserMap.get(client.id);

    await this.roomService.addAdmin(userId, dto);
    this.server.to(dto.roomId).emit('add-admin', dto);
  }

  @SubscribeMessage('remove-admin')
  async removeAdmin(client: Socket, dto: ActionRoomDto) {
    const userId = this.clientUserMap.get(client.id);

    await this.roomService.removeAdmin(userId, dto);
    this.server.to(dto.roomId).emit('remove-admin', dto);
  }

  @SubscribeMessage('room-message')
  async onRoomMessage(client: Socket, roomMessageDto: RoomMessageDto) {
    const userId = this.clientUserMap.get(client.id);
    roomMessageDto.senderId = userId;

    const room = await this.roomService.findById(roomMessageDto.roomId);
    if (!this.roomService.isParticipant(userId, room))
      throw new ForbiddenException('해당 방에 참여하고 있지 않습니다.');

    client
      .to(roomMessageDto.roomId)
      .except('block-' + userId)
      .emit('room-message', roomMessageDto);
    client.emit('room-message', roomMessageDto);
  }

  @SubscribeMessage('direct-message')
  async onDirectMessage(client: Socket, dto: DirectMessageDto) {
    dto.senderId = this.clientUserMap.get(client.id);

    client
      .to(this.userClientMap.get(Number(dto.receiverId)))
      .except('block-' + dto.senderId)
      .emit('direct-message', dto);
    client.emit('direct-message', dto);
    await this.messageService.createAndSave(dto);
  }

  @SubscribeMessage('message-load')
  async onMessageLoad(client: Socket, loadMessageDto: LoadMessageDto) {
    const userId = this.clientUserMap.get(client.id);
    const messages = await this.messageService.loadMessage(
      userId,
      loadMessageDto,
    );
    client.emit('message-load', messages);
  }

  @SubscribeMessage('user-list')
  async onUserList(client: Socket) {
    const userId = this.clientUserMap.get(client.id);
    const ids = Array.from(this.userClientMap.keys()).filter((id) => {
      return id !== userId;
    });
    const users = await this.userService.getUserDataByIds(ids);
    client.emit('user-list', users);
  }

  @SubscribeMessage('user-block')
  async onUserBlock(client: Socket, dto: ActionDto) {
    const userId = this.clientUserMap.get(client.id);
    const user = await this.userService.findOne(userId);
    // 친구라면 친구를 끊는 로직이 추가되어야 함
    await this.userService.block(user, dto.targetId);
    client.emit('user-block', dto);
    client.join('block-' + dto.targetId);
  }

  @SubscribeMessage('user-unblock')
  async onUserUnblock(client: Socket, dto: ActionDto) {
    const userId = this.clientUserMap.get(client.id);
    const user = await this.userService.findOne(userId);

    await this.userService.unblock(user, dto.targetId);
    client.emit('user-unblock', dto);
    client.leave('block-' + dto.targetId);
  }

  private async getConnectedUsersData() {
    const ids = Array.from(this.userClientMap.keys());
    return await this.userService.getUserDataByIds(ids);
  }

  private getClientByUserId(userId: number): Socket | null {
    const clientId = this.userClientMap.get(userId);
    if (!clientId) return null;

    return this.server.sockets.sockets.get(clientId);
  }
}
