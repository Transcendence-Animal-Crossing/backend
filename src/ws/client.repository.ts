import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Status } from './const/client.status';
import { Namespace } from './const/namespace';

@Injectable()
export class ClientRepository {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async connect(namespace, clientId, userId) {
    await this.cacheManager.set('client-' + clientId, userId);
    await this.cacheManager.set(namespace + 'user-' + userId, clientId);
  }

  async disconnect(namespace, clientId) {
    const userId = await this.findUserId(clientId);
    await this.cacheManager.del('client-' + clientId);
    await this.cacheManager.del(namespace + 'user-' + userId);
  }

  async findClientId(namespace, userId): Promise<string> {
    return await this.cacheManager.get(namespace + 'user-' + userId);
  }

  async findUserId(clientId): Promise<number> {
    return await this.cacheManager.get('client-' + clientId);
  }

  async getUserStatus(userId) {
    const clientId = await this.cacheManager.get(
      Namespace.CHAT + 'user-' + userId,
    );
    if (!clientId) return Status.OFFLINE;
    const gameId = await this.cacheManager.get('game-user-' + userId);
    if (gameId) return Status.IN_GAME;
    return Status.ONLINE;
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
