import { v1 as uuid } from 'uuid';

export class Room {
  constructor(name: string, ownerId: number) {
    this.id = uuid();
    this.name = name;
    this.ownerId = ownerId;
  }

  id: string;
  name: string;
  ownerId: number;
  bannedIds: number[];
  participantIds: number[];
  adminIds: number[];
}
