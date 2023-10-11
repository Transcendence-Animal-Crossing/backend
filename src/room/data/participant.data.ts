import { User } from '../../user/entities/user.entity';
import { UserData } from './user.data';

export class ParticipantData extends UserData {
  constructor(user: User, grade: number) {
    super(user);
    this.grade = grade;
    this.mute = false;
    this.joinTime = new Date();
    this.adminTime = new Date();
  }
  grade: number;
  mute: boolean;
  joinTime: Date;
  adminTime: Date;
}
