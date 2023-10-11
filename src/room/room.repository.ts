import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Room } from './data/room.data';

@Injectable()
export class RoomRepository {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
  async findAll() {
    const roomIds = (await this.cacheManager.get<string[]>('room-ids')) || [];
    return await Promise.all(roomIds.map((id) => this.find(id)));
  }
  async save(room) {
    await this.cacheManager.set('room-' + room.id, room);
    const roomIds = (await this.cacheManager.get<string[]>('room-ids')) || [];
    roomIds.push(room.id);
    await this.cacheManager.set('room-ids', roomIds);
  }
  async find(id): Promise<Room> | undefined {
    return this.cacheManager.get('room-' + id);
  }
  async update(room) {
    await this.cacheManager.set('room-' + room.id, room);
  }
  delete(id) {
    this.cacheManager.del('room-' + id);
  }
}
