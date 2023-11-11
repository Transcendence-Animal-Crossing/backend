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
  async delete(id) {
    await this.cacheManager.del('room-' + id);
    const roomIds = (await this.cacheManager.get<string[]>('room-ids')) || [];
    roomIds.splice(roomIds.indexOf(id), 1);
    await this.cacheManager.set('room-ids', roomIds);
  }
  async userJoin(roomId, userId) {
    await this.cacheManager.set('room-user-' + userId, roomId);
  }

  async userLeave(userId) {
    await this.cacheManager.del('room-user-' + userId);
  }

  async findRoomIdByUserId(userId): Promise<string> {
    return this.cacheManager.get('room-user-' + userId);
  }

  async saveMuteTimerId(targetId: number, timerId: NodeJS.Timeout) {
    await this.cacheManager.set('timer-' + targetId, timerId);
  }

  async findMuteTimerId(targetId: number): Promise<NodeJS.Timeout> {
    return await this.cacheManager.get('timer-' + targetId);
  }

  async deleteMuteTimerId(targetId: number) {
    await this.cacheManager.del('timer-' + targetId);
  }
}
