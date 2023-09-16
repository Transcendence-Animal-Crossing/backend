import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Room } from './room.entity';

@Entity()
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @ManyToOne(() => User, (user) => user.participants)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Room, (room) => room.participants)
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @Column()
  userId: number;

  @Column('uuid')
  roomId: string;
}
