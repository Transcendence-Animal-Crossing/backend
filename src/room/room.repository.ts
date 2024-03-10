// import { Injectable } from '@nestjs/common';
// import { Room } from './model/room.model';
// import { InjectRedis } from '@liaoliaots/nestjs-redis';
// import Redis from 'ioredis';
//
// @Injectable()
// export class RoomRepository {
//   constructor(@InjectRedis() private readonly redis: Redis) {}
//   async findAll(): Promise<Room[]> {
//     const rooms: Room[] = [];
//     const keys = await this.scanForRoomKeys();
//
//     for (const key of keys) {
//       const roomData = await this.redis.hgetall(key);
//       if (roomData) {
//         const room = this.convertToRoom(roomData);
//         rooms.push(room);
//       }
//     }
//
//     return rooms;
//   }
//
//   async save(room: Room) {
//     const roomData = {
//       id: room.id,
//       title: room.title,
//       participants: JSON.stringify(room.participants),
//       bannedUsers: JSON.stringify(room.bannedUsers),
//       invitedUsers: JSON.stringify(room.invitedUsers),
//       mode: room.mode,
//       password: room.password,
//     };
//
//     const flattenedRoomData = [];
//     for (const [key, value] of Object.entries(roomData)) {
//       flattenedRoomData.push(key, value);
//     }
//
//     await this.redis.hset('room:' + room.id, ...flattenedRoomData);
//   }
//
//   async find(id: string): Promise<Room> {
//     const roomData = await this.redis.hgetall('room:' + id);
//     if (!roomData) return null;
//     return this.convertToRoom(roomData);
//   }
//   async update(room: Room) {
//     await this.cacheManager.set('room-' + room.id, room);
//   }
//   async delete(id) {
//     await this.cacheManager.del('room-' + id);
//     const roomIds = (await this.cacheManager.get<string[]>('room-ids')) || [];
//     roomIds.splice(roomIds.indexOf(id), 1);
//     await this.cacheManager.set('room-ids', roomIds);
//   }
//   async userJoin(roomId, userId) {
//     await this.cacheManager.set('room-user-' + userId, roomId);
//   }
//
//   async userLeave(userId) {
//     await this.cacheManager.del('room-user-' + userId);
//   }
//
//   async findRoomIdByUserId(userId): Promise<string> {
//     return this.cacheManager.get('room-user-' + userId);
//   }
//
//   async saveMuteTimerId(targetId: number, timerId: NodeJS.Timeout) {
//     await this.cacheManager.set('timer-' + targetId, timerId);
//   }
//
//   async findMuteTimerId(targetId: number): Promise<NodeJS.Timeout> {
//     return await this.cacheManager.get('timer-' + targetId);
//   }
//
//   async deleteMuteTimerId(targetId: number) {
//     await this.cacheManager.del('timer-' + targetId);
//   }
//
//   async scanForRoomKeys(): Promise<string[]> {
//     let cursor = '0';
//     const keys: string[] = [];
//     do {
//       const reply = await this.redis.scan(cursor, 'MATCH', 'room:*');
//       cursor = reply[0];
//       keys.push(...reply[1]);
//     } while (cursor !== '0');
//     return keys;
//   }
//
//   convertToRoom(roomData: any): Room {
//     return <Room>{
//       id: roomData.id,
//       title: roomData.title,
//       participants: JSON.parse(roomData.participants),
//       bannedUsers: JSON.parse(roomData.bannedUsers),
//       invitedUsers: JSON.parse(roomData.invitedUsers),
//       mode: roomData.mode,
//       password: roomData.password,
//     };
//   }
// }
