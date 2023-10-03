import { v1 as uuid } from 'uuid';
import { UserData } from './user.data';

export class Room {
  constructor(
    title: string,
    owner: UserData,
    isPrivate: boolean,
    isLocked: boolean,
    password: string,
  ) {
    this.id = uuid();
    this.title = title;
    this.owner = owner;
    this.participants = [owner];
    this.admins = [owner];
    this.bannedUsers = [];
    this.isPrivate = isPrivate;
    this.isLocked = isLocked;
    this.password = password;
  }

  id: string;
  title: string;
  owner: UserData;
  participants: UserData[];
  admins: UserData[];
  bannedUsers: UserData[];
  isPrivate: boolean;
  isLocked: boolean;
  password: string;
}
