import { HttpStatus, Logger, UseFilters } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Socket } from 'socket.io';

import { RoomMessageDto } from './dto/room-message.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { DirectMessageDto } from './dto/direct-message.dto';
import { RoomService } from '../room/room.service';
import { ActionRoomDto } from './dto/action-room.dto';
import { ConfigRoomDto } from '../room/dto/config-room.dto';
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
    private readonly roomService: RoomService,
    private readonly chatService: ChatService,
    private readonly clientRepository: ClientRepository,
    private readonly clientService: ClientService,
    private readonly followService: FollowService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const user = await this.clientService.connect(this.server, client);
    this.logger.debug(
      '[WebSocket Connected!] nickName: ' +
        user.nickName +
        ', socketId: ' +
        client.id,
    );
  }

  async handleDisconnect(client: Socket) {
    await this.roomService.leave(this.server, client);
    this.logger.debug('[WebSocket Disconnected!] socketId: ' + client.id);
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
    const room = await this.roomService.create(this.server, client, dto);

    return { status: HttpStatus.OK, body: { id: room.id } };
  }

  @SubscribeMessage('room-mode')
  async changeRoomMode(client: Socket, dto: ConfigRoomDto) {
    this.logger.debug('Client Send Event <room-mode>');
    await this.roomService.changeMode(
      this.server,
      client,
      dto.mode,
      dto.password,
    );

    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('room-join')
  async onRoomJoin(client: Socket, dto: JoinRoomDto) {
    this.logger.debug('Client Send Event <room-join>');
    const room = await this.roomService.joinRoom(this.server, client, dto);

    return { status: HttpStatus.OK, body: DetailRoomDto.from(room) };
  }

  @SubscribeMessage('room-leave')
  async onRoomLeave(client: Socket) {
    this.logger.debug('Client Send Event <room-leave>');
    await this.roomService.leave(this.server, client);
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

    await this.roomService.mute(this.server, client, dto);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('room-unmute')
  async onRoomUnMute(client: Socket, dto: ActionRoomDto) {
    this.logger.debug('Client Send Event <room-unmute>');

    await this.roomService.unmute(this.server, client, dto);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('room-kick')
  async onRoomKick(client: Socket, dto: ActionRoomDto) {
    this.logger.debug('Client Send Event <room-kick>');
    const userId = await this.clientRepository.findUserId(client.id);

    await this.roomService.kick(this.server, userId, dto);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('room-ban')
  async onRoomBan(client: Socket, dto: ActionRoomDto) {
    this.logger.debug('Client Send Event <room-ban>');

    await this.roomService.ban(this.server, client, dto);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('room-unban')
  async onRoomUnban(client: Socket, dto: ActionRoomDto) {
    this.logger.debug('Client Send Event <room-unban>');

    await this.roomService.unban(this.server, client, dto);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('add-admin')
  async addAdmin(client: Socket, dto: ActionRoomDto) {
    this.logger.debug('Client Send Event <add-admin>');

    await this.roomService.addAdmin(this.server, client, dto);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('remove-admin')
  async removeAdmin(client: Socket, dto: ActionRoomDto) {
    this.logger.debug('Client Send Event <remove-admin>');

    await this.roomService.removeAdmin(this.server, client, dto);
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
    const userId = await this.clientRepository.findUserId(client.id);
    const messages = await this.chatService.loadWithPagination(userId, dto);
    return { status: HttpStatus.OK, body: messages };
  }

  @SubscribeMessage('dm-focus')
  async onDirectMessageFocus(client: Socket, dto: LoadMessageDto) {
    this.logger.debug('Client Send Event <dm-focus>');
    const userId = await this.clientRepository.findUserId(client.id);

    const beforeFocus: number = await this.clientService.getDMFocus(userId);
    if (beforeFocus) await this.chatService.updateLastRead(userId, beforeFocus);

    await this.clientService.changeDMFocus(userId, dto.targetId);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('friend-list')
  async onFriendList(client: Socket) {
    this.logger.debug('Client Send Event <friend-list>');
    const userId = await this.clientRepository.findUserId(client.id);
    if (!userId) return { status: HttpStatus.EARLYHINTS };

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

  // @SubscribeMessage('friend-request-list')
  // async onFriendRequestList(client: Socket) {
  //   this.logger.debug('Client Send Event <friend-request-list>');
  //   const userId = await this.clientRepository.findUserId(client.id);
  //   if (!userId) return { status: HttpStatus.EARLYHINTS };
  //
  //   const requests = await this.followService.findAllSentTo(userId);
  //   const requestsWithStatus = [];
  //   for (const request of requests) {
  //     const status = await this.clientRepository.getUserStatus(request.id);
  //     requestsWithStatus.push({
  //       ...request,
  //       status,
  //     });
  //   }
  //   return { status: HttpStatus.OK, body: requestsWithStatus };
  // }

  // @SubscribeMessage('friend-request')
  // async onFriendRequest(client: Socket) {
  //   this.logger.debug('Client Send Event <friend-request>');
  //   const userId = await this.clientRepository.findUserId(client.id);
  //   const user = await this.userService.findOne(userId);
  //   if (await this.userService.isBlocked(user, id))
  //     throw new HttpException(
  //       '차단한 사람은 친구추가 불가',
  //       HttpStatus.CONFLICT,
  //     );
  //   const isFollowed = await this.followService.findFollowWithDeleted(
  //     req.user.id,
  //     id,
  //   ); //이미 친구이면 exception
  //   if (isFollowed && !isFollowed.deletedAt) {
  //     throw new HttpException('already friend', HttpStatus.BAD_REQUEST);
  //   }
  //   return await this.followService.createRequest(req.user.id, id);
  // }

  @SubscribeMessage('block-list')
  async onBlockList(client: Socket) {
    this.logger.debug('Client Send Event <block-list>');
    const blockUserProfiles =
      await this.clientService.findBlockUserProfiles(client);
    return { status: HttpStatus.OK, body: blockUserProfiles };
  }

  async getClientByUserId(userId: number): Promise<Socket> {
    const clientId = await this.clientRepository.findClientId(userId);
    if (!clientId) return null;
    return this.server.sockets.sockets.get(clientId);
  }

  async changeUserProfile(user, nickName: string, avatar: string) {
    await this.roomService.changeUserProfile(
      this.server,
      user,
      nickName,
      avatar,
    );
  }
}
