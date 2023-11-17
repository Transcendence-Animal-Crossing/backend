import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class MessageHistory {
  private constructor(id: string) {
    this.id = id;
    this.lastReadMessageId = 0;
  }
  @PrimaryColumn()
  id: string;

  @Column()
  lastReadMessageId: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  static create(id: string): MessageHistory {
    return new MessageHistory(id);
  }

  static createHistoryId(receiverId: number, senderId: number): string {
    return `${receiverId}-${senderId}`;
  }

  static getSenderIdFromHistoryId(historyId) {
    return parseInt(historyId.split('-')[1]);
  }
}
