import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ClientRepository } from './client.repository';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { User } from '../user/entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { UserData } from '../room/data/user.data';
import { RoomService } from '../room/room.service';

@WebSocketGateway()
@Injectable()
export class ClientService {
  @WebSocketServer() server;
  private readonly logger: Logger = new Logger('ClientService');
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly roomService: RoomService,
  ) {}

  async connect(client: Socket) {
    this.logger.log('Trying to connect WebSocket...');
    const user = await this.findUserByToken(client);
    if (!user) {
      this.forceDisconnect(client, 'Invalid User.');
      return;
    }
    await this.clientRepository.connect(client.id, user.id);
    user.blockIds.map((id) => {
      this.ignoreUser(client, id);
    });
    // this.listenFriendsStatus(client, user);
    // this.sendStatusToFriends(client, user);

    this.logger.log('[WebSocket Connected!] nickName: ' + user.nickName);
  }

  async disconnect(client: Socket) {
    const user = await this.findUserByToken(client);
    if (!user) {
      this.forceDisconnect(client, 'Invalid User.');
      return;
    }

    const room = await this.roomService.getJoinedRoom(client);
    if (room) {
      await this.roomService.leave(user.id, room);
      this.server.to(room.id).emit('room-leave', new UserData(user));
    }

    await this.clientRepository.disconnect(client.id);
    this.logger.log('[WebSocket Disconnected!] nickName: ' + user.nickName);
  }

  async findUserByToken(client: Socket): Promise<User> {
    const token = client.handshake.auth.token;

    let jwtPayload;
    try {
      jwtPayload = this.authService.verifyAccessToken(token);
    } catch (error) {
      this.forceDisconnect(client, 'Invalid or Expired Token.');
      return;
    }
    return jwtPayload && (await this.userService.findOne(jwtPayload.id));
  }

  forceDisconnect(client: Socket, reason: string) {
    this.logger.log(
      '[WebSocket Disconnected!] reason: ' + reason + ' clientId: ' + client.id,
    );
    client.emit('exception', {
      status: HttpStatus.UNAUTHORIZED,
      message: reason,
    });
    client.disconnect(true);
  }

  async getConnectedUsersData() {
    const ids = await this.clientRepository.connectedUserIds();
    const connectedUsers = await this.userService.getUserDataByIds(ids);
    connectedUsers.map((user) => {
      user.status = 'ONLINE';
    });
    return connectedUsers;
  }

  async getClientByUserId(userId: number): Promise<Socket> {
    const clientId = await this.clientRepository.findClientId(userId);
    if (!clientId) return null;
    return this.server.sockets.sockets.get(clientId);
  }

  ignoreUser(client: Socket, userId: number) {
    client.join('block-' + userId);
  }

  // listenFriendsStatus(client: Socket, user: User) {
  //   const friends = user.friends;
  //   for (const friend of friends) {
  //     client.join('friend-' + friend.id);
  //   }
  //   client.on('disconnect', () => {
  //     for (const friend of friends) {
  //       client.leave('friend-' + friend.id);
  //     }
  //   });
  // }
  // sendStatusToFriends(client: Socket, user: User) {
  // client.to('follow-' + user.id).emit('follow', new UserData(user));
  // }
}
