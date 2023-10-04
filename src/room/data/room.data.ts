import { v1 as uuid } from 'uuid';
import { UserData } from './user.data';
import { ParticipantData } from './participant.data';
import { User } from '../../user/entities/user.entity';

export class Room {
  constructor(
    title: string,
    owner: User,
    isLocked: boolean,
    isPrivate: boolean,
    password: string,
  ) {
    this.id = uuid();
    this.title = title;
    this.participants = [new ParticipantData(owner, 2)];
    this.bannedUsers = [];
    this.invitedUsers = [];
    this.isPrivate = isPrivate;
    this.isLocked = isLocked;
    this.password = password;
  }

  id: string;
  title: string;
  participants: ParticipantData[];
  bannedUsers: UserData[];
  invitedUsers: UserData[];
  isPrivate: boolean;
  isLocked: boolean;
  password: string;
}
