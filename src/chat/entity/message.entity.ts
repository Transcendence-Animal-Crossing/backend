import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn, ManyToOne
} from "typeorm";
import { User } from "../../user/entities/user.entity";

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 250 })
  text: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User)
  sender: User;

  @ManyToOne(() => User)
  receiver: User;
}
