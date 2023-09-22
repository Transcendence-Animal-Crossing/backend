import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Message } from './message.entity';
import { Participant } from './participant.entity';

@Entity()
export class Room {
  constructor(name: string, ownerId: number) {
    this.name = name;
    this.ownerId = ownerId;
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  ownerId: number;

  // @Column('int', { array: true })
  // bannedIds: number[];

  @OneToMany(() => Message, (message: Message) => message.room)
  messages: Array<Message>;

  @OneToMany(() => Participant, (participant) => participant.room)
  participants: Array<Participant>;
}
