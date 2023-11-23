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
    await this.cacheManager.set('user-status-' + userId, 'ONLINE');
  }

  async disconnect(clientId) {
    const userId = await this.findUserId(clientId);
    await this.cacheManager.del('client-' + clientId);
    await this.cacheManager.del('user-' + userId);
    await this.cacheManager.del('user-status-' + userId);
  }

  async findClientId(userId): Promise<string> {
    return await this.cacheManager.get('user-' + userId);
  }

  async findUserId(clientId): Promise<number> {
    return await this.cacheManager.get('client-' + clientId);
  }

  async getUserStatus(userId) {
    const status = await this.cacheManager.get('user-status-' + userId);
    if (status) return status;
    return 'OFFLINE';
  }

  async saveDMFocus(userId, targetId) {
    await this.cacheManager.set('dm-focus-' + userId, targetId);
  }

  async getDMFocus(userId: number): Promise<number> {
    return await this.cacheManager.get('dm-focus-' + userId);
  }

  async deleteDMFocus(userId: number) {
    await this.cacheManager.del('dm-focus-' + userId);
  }
}
