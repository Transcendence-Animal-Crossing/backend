import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserData } from '../room/data/user.data';
import * as bcrypt from 'bcryptjs';
import { ResponseUserDto, toResponseUserDto } from './dto/response-user.dto';
import { existsSync } from 'fs';
import { join } from 'path';
import {
  DetailResponseUserDto,
  toDetailResponseUserDto,
} from './dto/detailResponse-user.dto';
import { Game } from 'src/game/entities/game.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Game) private readonly gameRepository: Repository<Game>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = this.userRepository.findOneBy({ id: id });
    if (!user) throw new NotFoundException('해당 유저가 존재하지 않습니다.');
    return user;
  }

  async findOneByIntraName(intraName: string): Promise<User> {
    return this.userRepository.findOne({
      where: { intraName: intraName },
    });
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
    return await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.nickName', 'user.intraName', 'user.avatar'])
      .where('user.id IN (:...ids)', { ids: ids })
      .getMany();
  }

  async createOrUpdateUser(userPublicData: any): Promise<User> {
    console.log('create', userPublicData.login);
    return this.userRepository.save(User.create(userPublicData));
  }

  async updatePassword(id: number, password: string) {
    const user = await this.userRepository.findOneBy({ id: id });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    const hashedPassword = await bcrypt.hash(password, 7);
    await this.userRepository.update(id, { password: hashedPassword });
  }

  async findOneById(
    id: number,
    detailed: boolean = false,
  ): Promise<ResponseUserDto | DetailResponseUserDto> {
    const user = await this.userRepository.findOneBy({ id: id });
    if (!user) throw new NotFoundException('해당 유저가 존재하지 않습니다.');

    return detailed ? toDetailResponseUserDto(user) : toResponseUserDto(user);
  }

  async isBlocked(userId: number, targetId: number) {
    const user = await this.findOne(userId);
    if (user.blockIds.includes(targetId)) return user;
    return null;
  }

  async block(user: User, targetId: number) {
    user.blockIds.push(targetId);
    await this.userRepository.save(user);
  }

  async unblock(user: User, targetId: number) {
    user.blockIds = user.blockIds.filter((id) => id !== targetId);
    await this.userRepository.save(user);
  }

  async saveProfileImage(id: number, nickName: string, filename: string) {
    const user = await this.userRepository.findOneBy({ id: id });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    await this.userRepository.update(id, {
      avatar: 'uploads/' + filename,
      nickName: nickName,
    });
  }
  async saveUrlImage(id: number, nickName: string, avatar: string) {
    const user = await this.userRepository.findOneBy({ id: id });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const avatarPath = join(__dirname, '..', '..', 'original', avatar);
    console.log('avatar', avatarPath);
    if (!existsSync(avatarPath)) {
      throw new HttpException('Avatar file not found', HttpStatus.NOT_FOUND);
    }
    await this.userRepository.update(id, {
      avatar: 'original/' + avatar,
      nickName: nickName,
    });
  }

  async checkNickName(id: number, nickName: string) {
    const user = await this.userRepository.findOneBy({ nickName: nickName });
    if (user) {
      if (user.id === id) return;
      throw new HttpException('already existed', HttpStatus.CONFLICT);
    }
  }

  async updateAchievements(intraName: string, achievement: string) {
    const user = await this.findOneByIntraName(intraName);
    if (!user) throw new HttpException('invalid user', HttpStatus.BAD_REQUEST);
    if (user.achievements && user.achievements.includes(achievement)) {
      throw new HttpException(
        'Achievement already exists in array',
        HttpStatus.BAD_REQUEST,
      );
    }
    user.achievements = [...(user.achievements || []), achievement];
    await this.userRepository.update(user.id, {
      achievements: user.achievements,
    });
  }

  async searchUser(name: string): Promise<ResponseUserDto[]> {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.intraName LIKE :name', { name: `%${name}%` })
      .orWhere('user.nickName LIKE :name', { name: `%${name}%` })
      .getMany();
    const responseUsers = users.map((user) => toResponseUserDto(user));
    return responseUsers;
  }

  async blockUser(id: number, blockId: number) {
    const user = await this.isBlocked(id, blockId);
    if (!user) this.block(user, blockId);
  }

  async unblockUser(id: number, unblockId: number) {
    const user = await this.isBlocked(id, unblockId);
    if (user) this.unblock(user, unblockId);
  }

  async getRankedUsers() {
    const users = await this.userRepository.find({
      order: {
        rankScore: 'DESC',
      },
      select: ['id', 'nickName', 'rankScore', 'intraName'],
    });
    const usersWithGameCount = [];

    for (const user of users) {
      const [winGamesCount, loseGamesCount] = await Promise.all([
        this.gameRepository.count({ where: { winnerId: user.id } }),
        this.gameRepository.count({ where: { loserId: user.id } }),
      ]);

      const totalGames = winGamesCount + loseGamesCount;

      usersWithGameCount.push({
        nickName: user.nickName,
        intraName: user.intraName,
        rankScore: user.rankScore,
        gameCount: totalGames,
      });
    }

    return usersWithGameCount;
  }
}
