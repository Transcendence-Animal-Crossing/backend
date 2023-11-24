import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Game } from './model/game.model';

@Injectable()
export class GameRepository {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async save(game) {
    await this.cacheManager.set('game-' + game.id, game);
    const gameIds = (await this.cacheManager.get<string[]>('game-ids')) || [];
    gameIds.push(game.id);
    await this.cacheManager.set('game-ids', gameIds);
  }
  async find(id): Promise<Game> | undefined {
    return this.cacheManager.get('game-' + id);
  }
  async update(game) {
    await this.cacheManager.set('game-' + game.id, game);
  }
  async delete(id) {
    await this.cacheManager.del('game-' + id);
    const gameIds = (await this.cacheManager.get<string[]>('game-ids')) || [];
    gameIds.splice(gameIds.indexOf(id), 1);
    await this.cacheManager.set('game-ids', gameIds);
  }
  async userJoin(gameId, userId) {
    await this.cacheManager.set('game-user-' + userId, gameId);
  }

  async userLeave(userId) {
    await this.cacheManager.del('game-user-' + userId);
  }

  async findGameIdByUserId(userId): Promise<string> {
    return this.cacheManager.get('game-user-' + userId);
  }
}
