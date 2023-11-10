import { HttpStatus, Logger, UseFilters } from '@nestjs/common';
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
import { DirectMessageDto } from './dto/direct-message.dto';
import { RoomService } from '../room/room.service';
import { ActionRoomDto } from './dto/action-room.dto';
import { ConfigRoomDto } from '../room/dto/config-room.dto';
import { LeaveRoomDto } from './dto/leave-room.dto';
import { WsExceptionFilter } from '../ws/filter/WsExceptionFilter';
import { DetailRoomDto } from '../room/dto/detail.room.dto';
import { ChatService } from './chat.service';
import { LoadMessageDto } from './dto/load-message.dto';
import { Room } from '../room/data/room.data';
import { ClientRepository } from '../ws/client.repository';
import { ClientService } from '../ws/client.service';
import { FollowService } from '../folllow/follow.service';

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
    private readonly chatService: ChatService,
    private readonly clientRepository: ClientRepository,
    private readonly clientService: ClientService,
    private readonly followService: FollowService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    await this.clientService.connect(client);
  }

  async handleDisconnect(client: Socket) {
    await this.clientService.disconnect(client);
  }

  @SubscribeMessage('room-lobby')
  async joinLobby(client: Socket) {
    this.logger.debug('Client Send Event <room-lobby>');
    const roomList = await this.roomService.joinLobby(client);
    return { status: HttpStatus.OK, body: roomList };
  }

  @SubscribeMessage('room-detail')
  async getRoomDetail(client: Socket, dto: ActionRoomDto) {
    this.logger.debug('Client Send Event <room-detail>');
    const room: Room = await this.roomService.findById(dto.roomId);
    return { status: HttpStatus.OK, body: DetailRoomDto.from(room) };
  }

  @SubscribeMessage('room-create')
  async createRoom(client: Socket, dto: ConfigRoomDto) {
    this.logger.debug('Client Send Event <room-create>');
    const room = await this.roomService.create(client, dto);

    return { status: HttpStatus.OK, body: { id: room.id } };
  }

  @SubscribeMessage('room-mode')
  async changeRoomMode(client: Socket, dto: ConfigRoomDto) {
    this.logger.debug('Client Send Event <room-mode>');
    await this.roomService.changeMode(client, dto.mode, dto.password);

    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('room-join')
  async onRoomJoin(client: Socket, dto: JoinRoomDto) {
    this.logger.debug('Client Send Event <room-join>');
    const room = await this.roomService.joinRoom(client, dto);

    return { status: HttpStatus.OK, body: DetailRoomDto.from(room) };
  }

  @SubscribeMessage('room-leave')
  async onRoomLeave(client: Socket, dto: LeaveRoomDto) {
    this.logger.debug('Client Send Event <room-leave>');
    const userId = await this.clientRepository.findUserId(client.id);
    const user = await this.userService.findOne(userId);
    const room = await this.roomService.findById(dto.roomId);

    await this.roomService.leave(client, user, room);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('room-invite')
  async onRoomInvite(client: Socket, dto: ActionRoomDto) {
    this.logger.debug('Client Send Event <room-invite>');

    await this.roomService.invite(client, dto);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('room-mute')
  async onRoomMute(client: Socket, dto: ActionRoomDto) {
    this.logger.debug('Client Send Event <room-mute>');

    await this.roomService.mute(client, dto);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('room-unmute')
  async onRoomUnMute(client: Socket, dto: ActionRoomDto) {
    this.logger.debug('Client Send Event <room-unmute>');

    await this.roomService.unmute(client, dto);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('room-kick')
  async onRoomKick(client: Socket, dto: ActionRoomDto) {
    this.logger.debug('Client Send Event <room-kick>');
    const userId = await this.clientRepository.findUserId(client.id);

    await this.roomService.kick(userId, dto);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('room-ban')
  async onRoomBan(client: Socket, dto: ActionRoomDto) {
    this.logger.debug('Client Send Event <room-ban>');

    await this.roomService.ban(client, dto);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('room-unban')
  async onRoomUnban(client: Socket, dto: ActionRoomDto) {
    this.logger.debug('Client Send Event <room-unban>');

    await this.roomService.unban(client, dto);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('add-admin')
  async addAdmin(client: Socket, dto: ActionRoomDto) {
    this.logger.debug('Client Send Event <add-admin>');

    await this.roomService.addAdmin(client, dto);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('remove-admin')
  async removeAdmin(client: Socket, dto: ActionRoomDto) {
    this.logger.debug('Client Send Event <remove-admin>');

    await this.roomService.removeAdmin(client, dto);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('room-message')
  async onRoomMessage(client: Socket, roomMessageDto: RoomMessageDto) {
    this.logger.debug('Client Send Event <room-message>');

    await this.roomService.sendMessage(client, roomMessageDto);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('direct-message')
  async onDirectMessage(client: Socket, dto: DirectMessageDto) {
    this.logger.debug('Client Send Event <direct-message>');

    // await this.chatService.directMessage(client, dto);
    dto.senderId = await this.clientRepository.findUserId(client.id);
    const receiver = await this.clientRepository.findClientId(dto.receiverId);
    client
      .to(receiver)
      .except('block-' + dto.senderId)
      .emit('direct-message', dto);
    client.emit('direct-message', dto);
    // const viewed: boolean = await client.emitWithAck('direct-message', dto);

    await this.chatService.createAndSave(dto, false);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('load-message')
  async onMessageLoad(client: Socket, loadMessageDto: LoadMessageDto) {
    this.logger.debug('Client Send Event <load-message>');
    const userId = await this.clientRepository.findUserId(client.id);
    const messages = await this.chatService.loadMessage(userId, loadMessageDto);
    return { status: HttpStatus.OK, body: messages };
  }

  // 없어질 함수
  @SubscribeMessage('user-list')
  async onUserList(client: Socket) {
    this.logger.debug('Client Send Event <user-list>');
    const userId = await this.clientRepository.findUserId(client.id);
    const connectedUsers = await this.clientRepository.connectedUserIds();
    const ids = Array.from(connectedUsers).filter((id) => {
      return id !== userId;
    });
    const users = await this.userService.getUserDataByIds(ids);
    return { status: HttpStatus.OK, body: users };
  }

  @SubscribeMessage('friend-list')
  async onFriendList(client: Socket) {
    this.logger.debug('Client Send Event <friend-list>');
    const userId = await this.clientRepository.findUserId(client.id);
    const friends = await this.followService.findAllFriends(userId);
    const friendsWithStatus = [];
    const unReadMessageData = await this.chatService.countUnReadMessage(userId);
    for (const friend of friends) {
      const status = await this.clientRepository.getUserStatus(friend.friendId);
      const unReadMessageCount = unReadMessageData[friend.friendId]
        ? unReadMessageData[friend.friendId]
        : 0;
      friendsWithStatus.push({
        ...friend,
        status,
        unReadMessageCount: unReadMessageCount,
      });
    }
    return { status: HttpStatus.OK, body: friendsWithStatus };
  }
}
