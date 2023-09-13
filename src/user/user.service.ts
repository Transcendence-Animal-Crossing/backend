import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findById(id: number): Promise<User> {
    const user = this.userRepository.findOneBy({ id: id });
    if (!user) throw new NotFoundException('해당 유저가 존재하지 않습니다.');
    return user;
  }

  async findByName(name: string): Promise<User> {
    return this.userRepository.findOneBy({ login: name });
  }

  async createOrUpdateUser(userPublicData: any): Promise<User> {
    let title_id: number;
    let title: string;
    for (let i = 0; i < userPublicData.titles_users.length; i++) {
      if (userPublicData.titles_users[i].selected === true) {
        title_id = userPublicData.titles_users[i].title_id;
        break;
      }
    }
    for (let i = 0; i < userPublicData.titles.length; i++) {
      if (userPublicData.titles[i].id === title_id) {
        title = userPublicData.titles[i].name;
        break;
      }
    }
    return this.userRepository.save(User.create(userPublicData, title));
  }

  // async login(loginDto: UserLoginDto): Promise<UserInfoDto> {
  //   const findUser: User = await this.userRepository.findOneBy({ login: loginDto.name });
  //   if (!findUser) throw new NotFoundException('해당 유저가 존재하지 않습니다.');
  //   if (findUser.password !== loginDto.password)
  //     throw new NotFoundException('비밀번호가 일치하지 않습니다.');
  //   return new UserInfoDto(findUser);
  // }
}
