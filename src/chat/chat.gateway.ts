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
import { CustomSocketFilter } from '../ws/filter/custom-socket.filter';
import { DetailRoomDto } from '../room/dto/detail.room.dto';
import { ChatService } from './chat.service';
import { LoadMessageDto } from './dto/load-message.dto';
import { Room } from '../room/data/room.data';
import { ClientRepository } from '../ws/client.repository';
import { ClientService } from '../ws/client.service';
import { FollowService } from '../folllow/follow.service';
import { Namespace } from '../ws/const/namespace';

// @UsePipes(new ValidationPipe())
@WebSocketGateway({ namespace: Namespace.CHAT })
@UseFilters(new CustomSocketFilter())
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
    console.log('clientId', client.id);
    const user = await this.clientService.connect(Namespace.CHAT, client);
    this.logger.log('[Chat WebSocket Connected!]: ' + user.nickName);
  }

  async handleDisconnect(client: Socket) {
    console.log('userId', client.data.userId);
    const user = await this.clientService.disconnect(Namespace.CHAT, client);
    const room = await this.roomService.getJoinedRoom(user.id);
    if (room) await this.roomService.leave(client, user, room);
    this.logger.log('[Chat WebSocket Disconnected!]: ' + user.nickName);
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
    const userId = await this.clientRepository.findUserId(
      Namespace.CHAT,
      client.id,
    );
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
    const userId = await this.clientRepository.findUserId(
      Namespace.CHAT,
      client.id,
    );

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

  @SubscribeMessage('dm')
  async onDirectMessageSend(client: Socket, dto: DirectMessageDto) {
    this.logger.debug('Client Send Event <dm-send>');

    await this.chatService.send(client, dto);

    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('dm-load')
  async onDirectMessageLoad(client: Socket, dto: LoadMessageDto) {
    this.logger.debug('Client Send Event <dm-load>');
    const userId = await this.clientRepository.findUserId(
      Namespace.CHAT,
      client.id,
    );
    const messages = await this.chatService.loadWithPagination(userId, dto);
    return { status: HttpStatus.OK, body: messages };
  }

  @SubscribeMessage('dm-focus')
  async onDirectMessageFocus(client: Socket, dto: LoadMessageDto) {
    this.logger.debug('Client Send Event <dm-focus>');
    const userId = await this.clientRepository.findUserId(
      Namespace.CHAT,
      client.id,
    );

    const beforeFocus: number = await this.clientService.getDMFocus(userId);
    if (beforeFocus) await this.chatService.updateLastRead(userId, beforeFocus);

    await this.clientService.changeDMFocus(userId, dto.targetId);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('friend-list')
  async onFriendList(client: Socket) {
    this.logger.debug('Client Send Event <friend-list>');
    const userId = await this.clientRepository.findUserId(
      Namespace.CHAT,
      client.id,
    );

    const friends = await this.followService.getSimpleFriends(userId);
    const friendsWithStatus = [];
    for (const friend of friends) {
      const status = await this.clientRepository.getUserStatus(friend.id);
      const unReadMessages = this.chatService.findUnReadMessageFromFriend(
        userId,
        friend.id,
      );
      friendsWithStatus.push({
        ...friend,
        status,
        unReadMessages,
      });
    }
    return { status: HttpStatus.OK, body: friendsWithStatus };
  }

  @SubscribeMessage('block-list')
  async onBlockList(client: Socket) {
    this.logger.debug('Client Send Event <block-list>');
    const userId = await this.clientRepository.findUserId(
      Namespace.CHAT,
      client.id,
    );
    const blockUserProfiles =
      await this.userService.findBlockUserProfiles(userId);

    return { status: HttpStatus.OK, body: blockUserProfiles };
  }
}
