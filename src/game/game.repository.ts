import { Injectable } from '@nestjs/common';
import { Game } from './model/game.model';
import Redis from 'ioredis';
import { InjectRedis } from '@liaoliaots/nestjs-redis';

@Injectable()
export class GameRepository {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async save(game: Game) {
    await this.redis.set('game-' + game.id, JSON.stringify(game));
  }
  async find(id: string): Promise<Game> | undefined {
    return JSON.parse(await this.redis.get('game-' + id));
  }
  async update(game: Game) {
    await this.redis.set('game-' + game.id, JSON.stringify(game));
  }
  async delete(id: string) {
    await this.redis.del('game-' + id);
  }
  async userJoin(gameId: string, userId: number) {
    await this.redis.set('game-user-' + userId, gameId);
  }

  async userLeave(userId: number) {
    await this.redis.del('game-user-' + userId);
  }

  async findGameIdByUserId(userId: number): Promise<string> {
    return this.redis.get('game-user-' + userId);
  }

  async findAll() {
    let cursor = '0';
    const keys: string[] = [];
    do {
      const reply = await this.redis.scan(cursor, 'MATCH', 'game-*');
      cursor = reply[0];
      keys.push(...reply[1]);
    } while (cursor !== '0');

    if (keys.length > 0) return this.redis.mget(...keys);

    return [];
  }
}
