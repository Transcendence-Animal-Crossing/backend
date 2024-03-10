import { User } from '../../user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Room } from './room.model';

@Entity()
export class RoomUser {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  grade: number;

  @ManyToOne(() => Room, (room) => room.roomUsers, {
    onDelete: 'CASCADE',
  })
  room: Room;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
  })
  user: User;

  @CreateDateColumn({ name: 'created_at', nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'last_modified_at', nullable: false })
  lastModifiedAt: Date;

  private constructor(grade: number) {
    this.grade = grade;
  }

  public static create(grade: number): RoomUser {
    return new RoomUser(grade);
  }
}
