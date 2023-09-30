import { BadRequestException, ForbiddenException, UnauthorizedException, UseFilters } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";

import { Socket } from "socket.io";
import { parse } from "cookie";

import { UserService } from "src/user/user.service";
import { AuthService } from "src/auth/auth.service";
import { RoomMessageDto } from "./dto/room-message.dto";
import { JoinRoomDto } from "./dto/join-room.dto";
import { User } from "../user/entities/user.entity";
import { Room } from "../room/entities/room.entity";
import { DirectMessageDto } from "./dto/direct-message.dto";
import { RoomService } from "../room/room.service";
import { ActionRoomDto } from "./dto/action-room.dto";
import { CreateRoomDto } from "../room/dto/create-room.dto";
import { LeaveRoomDto } from "./dto/leave-room.dto";
import { WsExceptionFilter } from "./WsExceptionFilter";

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
      client.emit('exception', { status: 401, message: 'Invalid or Expired Token.' });
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
    await this.roomService.create(dto.title, userId);
    this.server.emit('room-list', await this.roomService.findAll());
  }

  @SubscribeMessage('direct-message')
  async onDirectMessage(client: Socket, dto: DirectMessageDto) {
    console.log('onDirectMessage() dto: ' + dto);
    dto.senderId = this.clientUserMap.get(client.id);

    // user 가 차단되었는지 확인필요
    // message 저장필요
    client
      .to(this.userClientMap.get(Number(dto.receiverId)))
      .emit('direct-message', dto);
  }

  @SubscribeMessage('add-admin')
  async addAdmin(client: Socket, dto: ActionRoomDto) {
    const userId = this.clientUserMap.get(client.id);
    const room = this.roomService.findById(dto.roomId);
    if (!room.adminIds.includes(userId)) {
      throw new ForbiddenException('You have no permission to add admin!');
    }
    if (room.adminIds.includes(dto.targetId)) {
      throw new BadRequestException('Already admin!');
    }
    // participantIds 만 알려주는게 아니라, 해당 유저의 정보들도 줘야 함

    this.server
      .to(dto.roomId)
      .emit(
        'room-participants',
        this.roomService.findById(dto.roomId).participantIds,
      );
    console.log(
      'join()-participantIds: ' +
      this.roomService.findById(dto.roomId).participantIds,
    );
  }

  @SubscribeMessage('room-join')
  async onRoomJoin(client: Socket, dto: JoinRoomDto) {
    console.log('join()-roomId: ' + dto.roomId);
    client.join(dto.roomId);

    const userId = this.clientUserMap.get(client.id);
    this.roomService.joinRoom(userId, dto.roomId);

    this.server
      .to(dto.roomId)
      .emit(
        'room-participants',
        this.roomService.findById(dto.roomId).participantIds,
      );
    console.log(
      'join()-participantIds: ' +
        this.roomService.findById(dto.roomId).participantIds,
    );

    // const userId = this.clientUserMap.get(client.id);
    // console.log('join() userId: ' + userId);
    // if (!userId) throw new BadRequestException(`Invalid user!`);
    // const room: Room = this.rooms.get(roomId);
    // if (!room) throw new BadRequestException(`Invalid room!`);
    // console.log('join() room: ' + room);

    // if (room.bannedIds.includes(userId)) {
    //   throw new ForbiddenException(`You are banned from this room!`);
    // }

  }

  @SubscribeMessage('room-message')
  async onRoomMessage(client: Socket, roomMessageDto: RoomMessageDto) {
    const userId = this.clientUserMap.get(client.id);
    // const user: User = await this.userService.findById(userId);
    // if (this.userService.isParticipant(user, addMessageDto.roomId))
    //   throw new ForbiddenException(`You are not a member of this room!`);
    const { text, roomId } = roomMessageDto;
    console.log('roomId: ' + roomId);
    console.log('text: ' + text);
    roomMessageDto.userId = userId;

    client.to(roomMessageDto.roomId).emit('room-message', roomMessageDto);
  }

  @SubscribeMessage('room-kick')
  async onRoomKick(client: Socket, dto: ActionRoomDto) {
    const userId = this.clientUserMap.get(client.id);
    const room = this.roomService.findById(dto.roomId);
    if (!room.adminIds.includes(userId)) {
      throw new ForbiddenException('You have no permission to kick user!');
    }

    this.roomService.kick(dto.targetId, dto.roomId);

    this.server.to(dto.roomId).emit('room-kick', dto);

    const kickedClient = this.getClientByUserId(dto.targetId);
    kickedClient.leave(dto.roomId);
  }

  @SubscribeMessage('room-leave')
  async onRoomLeave(client: Socket, dto: LeaveRoomDto) {
    const userId = this.clientUserMap.get(client.id);
    this.roomService.leave(userId, dto.roomId);
    client.leave(dto.roomId);

    this.server
      .to(dto.roomId)
      .emit(
        'room-participants',
        this.roomService.findById(dto.roomId).participantIds,
      );
    console.log(
      'leave()-participantIds: ' +
        this.roomService.findById(dto.roomId).participantIds,
    );
  }

  private getClientByUserId(userId: number): Socket | null {
    const clientId = this.userClientMap.get(userId);
    if (!clientId) return null;

    return this.server.sockets.sockets.get(clientId);
  }

  // async handleConnection(client: Socket): Promise<void> {
  //   const cookies = parse(client.handshake.headers.cookie || '');
  //   let payload;
  //   try {
  //     payload = this.authService.verifyJwt(cookies.jwt);
  //   } catch (TokenExpiredError) {
  //     client.send('Token expired');
  //     client.disconnect(true);
  //     return;
  //   }
  //
  //   const user: User = payload && (await this.userService.findOne(payload.id));
  //   if (!user) {
  //     client.disconnect(true);
  //     return;
  //   }
  //   this.connectedUsers.set(client.id, user.id);
  //   console.log('user: ' + user);
  //
  //   const roomIds = await this.userService.findRoomIdsByUserId(user.id);
  //   if (roomIds) {
  //     for (const roomId of roomIds) {
  //       client.join(roomId.toString());
  //       // await this.onRoomJoin(client, { roomId: Number(roomId) });
  //     }
  //   }
  //   // if (room) {
  //   //   return this.onRoomJoin(client, { roomId: room.id });
  //   // }
  // }
  // @SubscribeMessage('message')
  // async onMessage(client: Socket, addMessageDto: AddMessageDto) {
  //   const userId = this.connectedUsers.get(client.id);
  //   // const user: User = await this.userService.findById(userId);
  //   // if (this.userService.isParticipant(user, addMessageDto.roomId))
  //   //   throw new ForbiddenException(`You are not a member of this room!`);
  //   const { text, roomId } = addMessageDto;
  //   console.log('roomId: ' + roomId);
  //   console.log('text: ' + text);
  //
  //   await this.roomService.addMessage(userId, roomId, text);
  //   client
  //     .to(addMessageDto.roomId.toString())
  //     .emit('message', addMessageDto.text);
  // }

  // @SubscribeMessage('join')
  // async onRoomJoin(client: Socket, joinRoomDto: JoinRoomDto) {
  //   console.log('join() joinRoomDto: ' + joinRoomDto);
  //   const { roomId } = joinRoomDto;
  //   const limit = 10;
  //
  //   const room = await this.roomService.findById(Number(roomId));
  //   const user = await this.userService.findOneWithParticipants(
  //     this.clientUserMap.get(client.id),
  //   );
  //   if (!user || !room) return;
  //   console.log('join() user: ' + user);
  //   console.log('join() room: ' + room);
  //
  //   await this.roomService.joinRoom(user, room);
  //   const messages = room.messages.slice(limit * -1);
  //
  //   client.join(roomId.toString());
  //   client.emit('message', messages);
  // }
}
//
//   @SubscribeMessage('leave')
//   async onRoomLeave(client: Socket, leaveRoomDto: LeaveRoomDto) {
//     const { roomId } = leaveRoomDto;
//     const userId = this.connectedUsers.get(client.id);
//
//     await this.userService.updateUserRoom(userId, null);
//
//     client.leave(roomId);
//   }
//
//   @SubscribeMessage('user-kick')
//   async onUserKick(client: Socket, kickUserDto: KickUserDto) {
//     const { roomId, reason } = kickUserDto;
//
//     const userId = this.connectedUsers.get(client.id);
//     const room = await this.roomService.findOneWithRelations(roomId);
//
//     if (userId !== room.ownerId) {
//       throw new ForbiddenException(`You are not the owner of the room!`);
//     }
//
//     await this.userService.updateUserRoom(kickUserDto.userId, null);
//
//     const kickedClient = this.getClientByUserId(kickUserDto.userId);
//
//     if (!kickedClient) return;
//
//     client.to(kickedClient.id).emit('kicked', reason);
//     kickedClient.leave(roomId);
//   }
//
//   @SubscribeMessage('user-ban')
//   async onUserBan(client: Socket, banUserDto: BanUserDto) {
//     const { roomId, reason } = banUserDto;
//
//     const userId = this.connectedUsers.get(client.id);
//     const room = await this.roomService.findOneWithRelations(roomId);
//
//     if (userId !== room.ownerId) {
//       throw new ForbiddenException(`You are not the owner of the room!`);
//     }
//
//     if (userId === banUserDto.userId) {
//       throw new ForbiddenException(`You can't ban yourself`);
//     }
//
//     await this.roomService.banUserFromRoom(banUserDto);
//
//     const bannedClient = this.getClientByUserId(banUserDto.userId);
//
//     if (!bannedClient) return;
//
//     client.to(bannedClient.id).emit('banned', reason);
//     bannedClient.leave(roomId);
//   }
//
//   private getClientByUserId(userId: string): Socket | null {
//     for (const [key, value] of this.connectedUsers.entries()) {
//       if (value === userId) {
//         const kickedClient = this.server.sockets.sockets.get(key);
//
//         return kickedClient;
//       }
//     }
//
//     return null;
//   }
// }
