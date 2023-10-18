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
  nickName: string;

  @Column()
  intraName: string;

  @Column()
  avatar: string;

  @Column()
  rankScore: number;

  @Column()
  two_factor_auth: boolean;

  @Column('text', { array: true, nullable: true })
  achievements: string[];

  @Column('int', { array: true, nullable: true })
  blockIds: number[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  static create(data: any): User {
    const user = new User();
    user.id = data.id;
    user.password = '';
    user.nickName = data.login;
    user.intraName = data.login;
    user.avatar = 'original/profile2.png';
    user.rankScore = 1000;
    user.two_factor_auth = false;
    user.achievements = [];
    user.blockIds = [];
    return user;
  }
}
