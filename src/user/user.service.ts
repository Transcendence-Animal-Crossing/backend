import { Injectable, NotFoundException } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserData } from '../room/data/user.data';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = this.userRepository.findOneBy({ id: id });
    if (!user) throw new NotFoundException('해당 유저가 존재하지 않습니다.');
    return user;
  }

  async findOneWithParticipants(id: number): Promise<User> {
    const user = this.userRepository.findOne({
      where: { id: id },
      relations: ['participants'],
    });
    if (!user) throw new NotFoundException('해당 유저가 존재하지 않습니다.');
    return user;
  }

  async findByName(name: string): Promise<User> {
    return this.userRepository.findOneBy({ intraName: name });
  }

  async findByIds(ids: number[]): Promise<User[]> {
    return this.userRepository.findBy({ id: In(ids) });
  }

  async getUserDataByIds(ids: number[]): Promise<UserData[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.nickName', 'user.intraName', 'user.avatar'])
      .where('user.id IN (:...ids)', { ids: ids })
      .getMany();
  }

  async createOrUpdateUser(userPublicData: any): Promise<User> {
    return this.userRepository.save(User.create(userPublicData));
  }
}
