import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Message {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  history_id: string;

  @Column({ length: 250 })
  text: string;

  @CreateDateColumn()
  created_at: Date;

  static create(historyId: string, text: string): Message {
    const message = new Message();
    message.history_id = historyId;
    message.text = text;
    return message;
  }
}
