import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Ball } from './model/ball.model';

@Injectable()
export class BallRepository {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async save(ball: Ball) {
    await this.cacheManager.set('game-ball' + ball.id, ball);
  }
  async find(id): Promise<Ball> | undefined {
    return this.cacheManager.get('game-ball-' + id);
  }
  async update(ball) {
    await this.cacheManager.set('game-ball-' + ball.id, ball);
  }
  async delete(id) {
    await this.cacheManager.del('game-ball-' + id);
  }
}
