import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ClientRepository } from './client.repository';
import { Socket } from 'socket.io';
import { User } from '../user/entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { FollowService } from '../folllow/follow.service';
import { Status } from './const/client.status';
import { Namespace } from './const/namespace';
import { MessageHistory } from '../chat/entity/message-history.entity';
import { Repository } from 'typeorm';
import { Message } from '../chat/entity/message.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ClientService {
  private readonly logger: Logger = new Logger('ClientService');

  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly followService: FollowService,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(MessageHistory)
    private readonly messageHistoryRepository: Repository<MessageHistory>,
  ) {}

  async connect(server, namespace, client: Socket) {
    this.logger.log('Trying to connect WebSocket...');
    const user = await this.findUserByToken(client);
    const oldClientId = await this.clientRepository.findClientId(
      namespace,
      user.id,
    );
    if (oldClientId) return this.forceDisconnect(client, 'Already Connected.');
    client.data.userId = user.id;
    await this.clientRepository.connect(namespace, client.id, user.id);
    if (namespace === Namespace.CHAT) {
      user.blockIds.map((id) => {
        client.join('block-' + id);
      });
      await this.listenFriendsStatus(client, user);
      await this.sendUpdateToFriends(server, user, Status.ONLINE);
    }
    return user;
  }

  async disconnect(server, namespace, client: Socket) {
    const user = await this.findUserByToken(client);
    await this.clientRepository.disconnect(namespace, client.id);
    if (namespace === Namespace.CHAT) {
      await this.sendUpdateToFriends(server, user, Status.OFFLINE);
      const dmFocus: number = await this.getDMFocus(user.id);
      if (dmFocus) await this.updateLastRead(user.id, dmFocus);
      await this.clientRepository.deleteDMFocus(user.id);
      return user;
    }
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

  forceDisconnect(client: Socket, reason: string): void {
    this.logger.log(
      '[WebSocket Disconnected!] reason: ' + reason + ' clientId: ' + client.id,
    );
    client.emit('exception', {
      status: HttpStatus.UNAUTHORIZED,
      message: reason,
    });
    client.disconnect(true);
  }

  async getClientByUserId(server, namespace, userId: number): Promise<Socket> {
    const clientId = await this.clientRepository.findClientId(
      namespace,
      userId,
    );
    if (!clientId) return null;
    return server.sockets.get(clientId);
  }

  async listenFriendsStatus(client: Socket, user: User) {
    const friends = await this.followService.getSimpleFriends(user.id);
    for (const friend of friends) {
      client.join('friend-' + friend.id);
    }
  }

  sendUpdateToFriends(server, user: User, status: string) {
    server.to('friend-' + user.id).emit('friend-update', {
      id: user.id,
      nickName: user.nickName,
      intraName: user.intraName,
      avatar: user.avatar,
      status: status,
    });
  }

  async findUserIdByClientId(id: string): Promise<number> {
    return await this.clientRepository.findUserId(id);
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

  async findBlockUserProfiles(client: Socket) {
    const userId = await this.clientRepository.findUserId(client.id);
    return await this.userService.findBlockUserProfiles(userId);
  }

  private async updateLastRead(userId: number, dmFocus: number) {
    const historyId = MessageHistory.createHistoryId(userId, dmFocus);
    const lastMessage = await this.messageRepository
      .createQueryBuilder('message')
      .select('message.id AS id')
      .where('history_id = :historyId', { historyId: historyId })
      .orderBy('message.id', 'DESC')
      .getRawOne();

    if (lastMessage)
      await this.messageHistoryRepository.update(
        { id: historyId },
        { lastReadMessageId: lastMessage.id },
      );
  }
}
