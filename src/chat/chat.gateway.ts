import { UseFilters } from '@nestjs/common';
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
  }

  async handleDisconnect(client: Socket) {
    const userId = this.clientUserMap.get(client.id);
    this.clientUserMap.delete(client.id);
    this.userClientMap.delete(userId);
    console.log('disconnected: ' + client.id + ' ' + userId);
  }

  @SubscribeMessage('room-list')
  async getRoomList(client: Socket) {
    client.emit('room-list', await this.roomService.findAll());
  }

  @SubscribeMessage('room-create')
  async createRoom(client: Socket, dto: CreateRoomDto) {
    const userId = this.clientUserMap.get(client.id);
    await this.roomService.create(dto, userId);
    this.server.emit('room-list', await this.roomService.findAll());
  }

  @SubscribeMessage('direct-message')
  async onDirectMessage(client: Socket, dto: DirectMessageDto) {
    dto.senderId = this.clientUserMap.get(client.id);

    // user 가 차단되었는지 확인필요
    // message 저장필요
    client
      .to(this.userClientMap.get(Number(dto.receiverId)))
      .emit('direct-message', dto);
    client.emit('direct-message', dto);
  }

  @SubscribeMessage('add-admin')
  async addAdmin(client: Socket, dto: ActionRoomDto) {
    const userId = this.clientUserMap.get(client.id);

    await this.roomService.addAdmin(userId, dto);
  }

  @SubscribeMessage('room-join')
  async onRoomJoin(client: Socket, dto: JoinRoomDto) {
    client.join(dto.roomId);

    const userId = this.clientUserMap.get(client.id);
    // user 가 ban 되었는지 확인
    const room = this.roomService.findById(dto.roomId);
    this.roomService.joinRoom(userId, room);

    this.server.to(dto.roomId).emit('room-detail', new DetailRoomDto(room));
  }

  @SubscribeMessage('room-message')
  async onRoomMessage(client: Socket, roomMessageDto: RoomMessageDto) {
    const userId = this.clientUserMap.get(client.id);
    roomMessageDto.senderId = userId;

    client.to(roomMessageDto.roomId).emit('room-message', roomMessageDto);
    client.emit('room-message', roomMessageDto);
  }

  @SubscribeMessage('room-kick')
  async onRoomKick(client: Socket, dto: ActionRoomDto) {
    const userId = this.clientUserMap.get(client.id);

    this.roomService.kick(userId, dto);
    this.server.to(dto.roomId).emit('room-kick', dto);

    const kickedClient = this.getClientByUserId(dto.targetId);
    kickedClient.leave(dto.roomId);
  }

  @SubscribeMessage('room-leave')
  async onRoomLeave(client: Socket, dto: LeaveRoomDto) {
    const userId = this.clientUserMap.get(client.id);
    const room = this.roomService.findById(dto.roomId);

    this.roomService.leave(userId, room);
    client.leave(dto.roomId);

    this.server.to(dto.roomId).emit('room-detail', new DetailRoomDto(room));
  }

  private getClientByUserId(userId: number): Socket | null {
    const clientId = this.userClientMap.get(userId);
    if (!clientId) return null;

    return this.server.sockets.sockets.get(clientId);
  }
}
