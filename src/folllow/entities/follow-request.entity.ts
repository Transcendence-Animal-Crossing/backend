import { User } from 'src/user/entities/user.entity';
import {
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class FollowRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  sendBy: User;

  @ManyToOne(() => User)
  sendTo: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
