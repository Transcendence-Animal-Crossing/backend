import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryColumn()
  id: number;

  @Column()
  password: string;

  @Column()
  login: string;

  @Column()
  email: string;

  @Column()
  win: number;

  @Column()
  lose: number;

  @Column()
  two_factor_auth: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  static create(data: any): User {
    const user = new User();
    user.id = data.id;
    user.password = '';
    user.login = data.login;
    user.email = data.email;
    user.win = 0;
    user.lose = 0;
    user.two_factor_auth = false;
    return user;
  }
}
