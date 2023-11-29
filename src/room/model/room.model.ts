import { v1 as uuid } from 'uuid';
import { UserProfile } from '../../user/model/user.profile.model';
import { Participant } from './participant.model';
import { User } from '../../user/entities/user.entity';
import { Grade } from '../enum/user.grade.enum';

export class Room {
  SECOND = 1000;
  MUTE_DURATION = 600 * this.SECOND;

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

  findUserGrade(userId: number): Grade {
    for (const participant of this.participants) {
      if (participant.id === userId) {
        return participant.grade;
      }
    }
    return null;
  }

  promoteUser(userId: number): void {
    for (const participant of this.participants) {
      if (participant.id === userId) {
        participant.grade = Grade.ADMIN;
        return;
      }
    }
  }

  demoteUser(userId: number): void {
    for (const participant of this.participants) {
      if (participant.id === userId) {
        participant.grade = Grade.PARTICIPANT;
        return;
      }
    }
  }

  inviteUser(user: User): void {
    this.invitedUsers.push(UserProfile.fromUser(user));
  }

  muteUser(userId: number): void {
    for (const participant of this.participants) {
      if (participant.id === userId) {
        participant.mute = true;
        return;
      }
    }
  }

  unmuteUser(userId: number): void {
    for (const participant of this.participants) {
      if (participant.id === userId) {
        participant.mute = false;
        return;
      }
    }
  }

  leaveUser(userId: number): Participant[] {
    for (let i = 0; i < this.participants.length; i++) {
      if (this.participants[i].id === userId) {
        return this.participants.splice(i, 1);
      }
    }
  }

  sortParticipants(): void {
    this.participants.sort((a, b) => {
      if (a.grade > b.grade) return -1;
      else if (a.grade < b.grade) return 1;
      else {
        if (a.grade === Grade.ADMIN) {
          if (a.adminTime > b.adminTime) return -1;
          else if (a.adminTime < b.adminTime) return 1;
          else return 0;
        } else {
          if (a.joinTime > b.joinTime) return -1;
          else if (a.joinTime < b.joinTime) return 1;
          else return 0;
        }
      }
    });
  }

  isMuted(targetId: number) {
    for (const participant of this.participants) {
      if (participant.id === targetId) {
        return participant.mute;
      }
    }
    return false;
  }
}
