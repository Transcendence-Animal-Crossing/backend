import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ClientRepository } from './client.repository';
import { WebSocketServer } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { User } from '../user/entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';

@Injectable()
export class ClientService {
  @WebSocketServer() server;
  private readonly logger: Logger = new Logger('ClientService');
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  async connect(client: Socket) {
    this.logger.log('Trying to connect WebSocket... (Token: ' + token + ')');
    const token = client.handshake.auth.token;
    let user: User;
    try {
      const payload = this.authService.verifyAccessToken(token);
      user = payload && (await this.userService.findOne(payload.id));
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
    this.logger.log(
      '[WebSocket Connected!] userId: ' +
      user.id +
      ' nickName: ' +
      user.nickName,
    );
  }

}