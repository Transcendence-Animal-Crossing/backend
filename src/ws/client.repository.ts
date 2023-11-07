import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { WebSocketServer } from '@nestjs/websockets';

@Injectable()
export class ClientRepository {
  @WebSocketServer()
  server;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async connect(clientId, userId) {
    await this.cacheManager.set('client-' + clientId, userId);
    await this.cacheManager.set('user-' + userId, clientId);
    await this.cacheManager.set('user-' + userId + 'status', 'ONLINE');
  }

  async disconnect(clientId) {
    const userId = await this.findUserId(clientId);
    await this.cacheManager.del('client-' + clientId);
    await this.cacheManager.del('user-' + userId);
    await this.cacheManager.del('user-' + userId + 'status');
  }

  async findClientId(userId): Promise<string> {
    return await this.cacheManager.get('user-' + userId);
  }

  async findUserId(clientId): Promise<number> {
    return await this.cacheManager.get('client-' + clientId);
  }

  async connectedUserIds(): Promise<number[]> {
    return this.server.allSockets().then((clientIds) => {
      const userIds = [];
      for (const clientId of clientIds) {
        userIds.push(this.findUserId(clientId));
      }
      return userIds;
    });
  }

  async getUserStatus(userId): Promise<string> {
    return await this.cacheManager.get('user-' + userId + 'status');
  }

  async saveTimerId(targetId: number, timerId: NodeJS.Timeout) {
    await this.cacheManager.set('timer-' + targetId, timerId);
  }

  async findTimerId(targetId: number): Promise<NodeJS.Timeout> {
    return await this.cacheManager.get('timer-' + targetId);
  }

  async deleteTimerId(targetId: number) {
    await this.cacheManager.del('timer-' + targetId);
  }
}
