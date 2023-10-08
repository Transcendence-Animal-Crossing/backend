import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: number): Promise<User | null> {
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

  async createOrUpdateUser(userPublicData: any): Promise<User> {
    console.log('create', userPublicData.nickName);
    return this.userRepository.save(User.create(userPublicData));
  }

  async updateUser(userDto: CreateUserDto) {
    const user = await this.findByName(userDto.intraName);
    if (!user) {
      return null;
    }
    const hashedPassword = await bcrypt.hash(userDto.password, 7);
    user.password = hashedPassword;
    user.nickName = userDto.nickName;
    await this.userRepository.save(user);
    return user.id;

    //todo: 이거 업데이트 하는걸로 빼야함,,
  }
}
