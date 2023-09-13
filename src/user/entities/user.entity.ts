import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Game } from '../../game/game.entity';

@Entity()
export class User {
  @PrimaryColumn()
  id: number;

  @Column()
  login: string;

  @Column()
  email: string;

  @Column()
  title: string;

  @Column()
  win: number;

  @Column()
  lose: number;

  @Column()
  two_factor_auth: boolean;

  @OneToMany(() => Game, (game) => game.host)
  hostGames: Game[];

  @OneToMany(() => Game, (game) => game.guest)
  guestGames: Game[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  static create(data: any, title: string): User {
    const user = new User();
    user.id = data.id;
    user.login = data.login;
    user.email = data.email;
    user.title = title;
    user.win = 0;
    user.lose = 0;
    user.two_factor_auth = false;
    return user;
  }
}
