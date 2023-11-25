import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Players } from './model/players.model';

@Injectable()
export class PlayersRepository {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async save(players: Players) {
    await this.cacheManager.set('game-players' + players.id, players);
  }
  async find(id): Promise<Players> | undefined {
    return this.cacheManager.get('players-' + id);
  }
  async update(players) {
    await this.cacheManager.set('game-players-' + players.id, players);
  }
  async delete(id) {
    await this.cacheManager.del('game-players-' + id);
  }
}
