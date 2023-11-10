import { v1 as uuid } from 'uuid';
import { UserData } from './user.data';
import { ParticipantData } from './participant.data';
import { User } from '../../user/entities/user.entity';
import { Grade } from './user.grade';

export class Room {
  private constructor(
    title: string,
    owner: User,
    mode: string,
    password: string,
  ) {
    this.id = uuid();
    this.title = title;
    this.participants = [];
    this.participants.push(ParticipantData.of(owner, Grade.OWNER));
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

  public static create(
    title: string,
    owner: User,
    mode: string,
    password: string,
  ): Room {
    return new Room(title, owner, mode, password);
  }
}
