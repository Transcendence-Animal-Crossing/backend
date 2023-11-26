import { v1 as uuid } from 'uuid';
import { UserProfile } from '../../user/model/user.profile.model';
import { Participant } from './participant.model';
import { User } from '../../user/entities/user.entity';
import { Grade } from '../enum/user.grade.enum';

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
    this.participants.push(Participant.of(owner, Grade.OWNER));
    this.bannedUsers = [];
    this.invitedUsers = [];
    this.mode = mode;
    this.password = password;
  }

  id: string;
  title: string;
  participants: Participant[];
  bannedUsers: UserProfile[];
  invitedUsers: UserProfile[];
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

  isParticipant(userId): boolean {
    return this.participants.some((participant) => participant.id === userId);
  }

  isBanned(userId): boolean {
    return this.bannedUsers.some((bannedUser) => bannedUser.id === userId);
  }

  isProtected(): boolean {
    return this.mode === 'PROTECTED';
  }

  isPrivate(): boolean {
    return this.mode === 'PRIVATE';
  }

  validatePassword(password: string): boolean {
    return this.password === password;
  }

  isInvited(userId): boolean {
    return this.invitedUsers.some((invitedUser) => invitedUser.id === userId);
  }
}
