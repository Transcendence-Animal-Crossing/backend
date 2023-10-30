import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ length: 250 })
  text: string;

  @Column()
  viewed: boolean;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User)
  sender: User;

  @ManyToOne(() => User)
  receiver: User;

  static create(
    text: string,
    viewed: boolean,
    sender: User,
    receiver: User,
  ): Message {
    const message = new Message();
    message.text = text;
    message.viewed = viewed;
    message.sender = sender;
    message.receiver = receiver;
    return message;
  }
}
