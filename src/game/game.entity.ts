import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../user/entities/user.entity';

@Entity()
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  date: Date;

  @Column()
  hostScore: number;

  @Column()
  guestScore: number;

  @ManyToOne(() => User, (user) => user.hostGames)
  host: User;

  @ManyToOne(() => User, (user) => user.guestGames)
  guest: User;
}
