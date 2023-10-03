import { Room } from '../data/room.data';
import { UserData } from '../data/user.data';

export class DetailRoomDto {
  constructor(room: Room) {
    this.id = room.id;
    this.title = room.title;
    this.owner = room.owner;
    this.participants = room.participants;
    this.admins = room.admins;
    this.bannedUsers = room.bannedUsers;
    this.isPrivate = room.isPrivate;
    this.isLocked = room.isLocked;
  }
  id: string;
  title: string;
  owner: UserData;
  participants: UserData[];
  admins: UserData[];
  bannedUsers: UserData[];
  isPrivate: boolean;
  isLocked: boolean;
}
