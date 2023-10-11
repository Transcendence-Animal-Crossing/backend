import { v1 as uuid } from 'uuid';
import { UserData } from './user.data';
import { ParticipantData } from './participant.data';
import { User } from '../../user/entities/user.entity';

export class Room {
  constructor(title: string, owner: User, mode: string, password: string) {
    this.id = uuid();
    this.title = title;
    this.participants = [];
    this.participants.push(new ParticipantData(owner, 2));
    this.bannedUsers = [];
    this.invitedUsers = [];
    this.mode = mode;
    this.password = password;
  }

  id: string;
  title: string;
  participants: ParticipantData[];
  bannedUsers: UserData[];
  invitedUsers: UserData[];
  mode: string;
  password: string;
}
