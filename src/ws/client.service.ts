import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ClientRepository } from './client.repository';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { User } from '../user/entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { FollowService } from '../folllow/follow.service';
import { Status } from './const/client.status';

@WebSocketGateway()
@Injectable()
export class ClientService {
  @WebSocketServer() server;
  private readonly logger: Logger = new Logger('ClientService');

  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly followService: FollowService,
  ) {}

  async connect(namespace, client: Socket) {
    this.logger.log('Trying to connect WebSocket...');
    const user = await this.findUserByToken(client);
    client.data.userId = user.id;
    await this.clientRepository.connect(namespace, client.id, user.id);
    user.blockIds.map((id) => {
      this.ignoreUser(client, id);
    });
    await this.listenFriendsStatus(client, user);
    await this.sendUpdateToFriends(user, Status.ONLINE);
    return user;
  }

  async disconnect(namespace, client: Socket) {
    const user = await this.findUserByToken(client);
    await this.clientRepository.disconnect(namespace, client.id);
    await this.sendUpdateToFriends(user, Status.OFFLINE);
    return user;
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
    const user = await this.userService.findOne(jwtPayload?.id);
    if (!user) {
      this.forceDisconnect(client, 'Invalid User.');
      return;
    }
    return user;
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

  async getClientByUserId(namespace, userId: number): Promise<Socket> {
    const clientId = await this.clientRepository.findClientId(
      namespace,
      userId,
    );
    if (!clientId) return null;
    return this.server.sockets.sockets.get(clientId);
  }

  ignoreUser(client: Socket, userId: number) {
    client.join('block-' + userId);
  }

  async listenFriendsStatus(client: Socket, user: User) {
    const friends = await this.followService.getSimpleFriends(user.id);
    for (const friend of friends) {
      client.join('friend-' + friend.id);
    }
  }

  sendUpdateToFriends(user: User, status: string) {
    this.server.to('friend-' + user.id).emit('friend-update', {
      id: user.id,
      nickName: user.nickName,
      avatar: user.avatar,
      status: status,
    });
  }

  async findUserIdByClientId(namespace, id: string): Promise<number> {
    return await this.clientRepository.findUserId(namespace, id);
  }

  async findClientIdByUserId(namespace, id: number): Promise<string> {
    return await this.clientRepository.findClientId(namespace, id);
  }

  async getDMFocus(userId: number) {
    return await this.clientRepository.getDMFocus(userId);
  }

  async changeDMFocus(userId: number, targetId: number) {
    if (targetId === null) {
      await this.clientRepository.deleteDMFocus(userId);
      return;
    }
    await this.clientRepository.saveDMFocus(userId, targetId);
  }
}
