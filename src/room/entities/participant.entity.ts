import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Room } from './room.entity';

@Entity()
export class Participant {
  constructor(user: User, room: Room) {
    this.user = user;
    this.room = room;
  }
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.participants)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Room, (room) => room.participants)
  @JoinColumn({ name: 'roomId' })
  room: Room;
}
