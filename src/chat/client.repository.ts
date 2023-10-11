import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ClientRepository {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async connect(clientId, userId) {
    await this.connectedUserIds().then((users) => {
      users.push(userId);
      this.cacheManager.set('connected-users', users);
    });
    await this.cacheManager.set('client-' + clientId, userId);
    await this.cacheManager.set('user-' + userId, clientId);
  }

  async disconnect(clientId) {
    const userId = await this.findUserId(clientId);
    await this.connectedUserIds().then((users) => {
      users.splice(users.indexOf(userId), 1);
      this.cacheManager.set('connected-users', users);
    });
    await this.cacheManager.del('client-' + clientId);
    await this.cacheManager.del('user-' + userId);
  }

  async findClientId(userId): Promise<string> {
    return await this.cacheManager.get('user-' + userId);
  }

  async findUserId(clientId): Promise<number> {
    return await this.cacheManager.get('client-' + clientId);
  }

  async connectedUserIds(): Promise<number[]> {
    return (await this.cacheManager.get<number[]>('connected-users')) || [];
  }
}
