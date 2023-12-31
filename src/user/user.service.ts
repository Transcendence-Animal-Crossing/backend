import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { ResponseUserDto, toResponseUserDto } from './dto/response-user.dto';
import { existsSync } from 'fs';
import { join } from 'path';
import {
  DetailResponseUserDto,
  toDetailResponseUserDto,
} from './dto/detailResponse-user.dto';
import { GameHistory } from 'src/game/entities/game-history.entity';
import { GameRecord } from 'src/gameRecord/entities/game-record';
import { PAGINATION_LIMIT } from 'src/common/constants';
import { FollowService } from 'src/folllow/follow.service';
import { AchievementService } from 'src/achievement/achievement.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(GameHistory)
    private readonly gameHistoryRepository: Repository<GameHistory>,
    @InjectRepository(GameRecord)
    private readonly gameRecordRepository: Repository<GameRecord>,
    private readonly followService: FollowService,
    private readonly achievementService: AchievementService,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = this.userRepository.findOneBy({ id: id });
    if (!user)
      throw new HttpException(
        '해당 유저가 존재하지 않습니다.',
        HttpStatus.NOT_FOUND,
      );
    return user;
  }

  async findOneByIntraName(intraName: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { intraName: intraName },
    });
    if (!user)
      throw new HttpException(
        '해당 인트라네임을 가진 유저가 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    return user;
  }

  async findByName(name: string): Promise<User> {
    return this.userRepository.findOneBy({ intraName: name });
  }

  async findBlockUserProfiles(userId: number) {
    const user = await this.userRepository.findOneBy({ id: userId });
    const blockUserProfiles = await this.userRepository
      .createQueryBuilder('user')
      .select('user.id')
      .addSelect('user.nickName')
      .addSelect('user.intraName')
      .addSelect('user.avatar')
      .where('user.id IN (:...ids)', { ids: user.blockIds })
      .getRawMany();
    return blockUserProfiles.map((blockUserProfile) => {
      return {
        id: blockUserProfile.user_id,
        nickName: blockUserProfile.user_nickName,
        intraName: blockUserProfile.user_intraName,
        avatar: blockUserProfile.user_avatar,
      };
    });
  }

  async findByIds(ids: number[]): Promise<User[]> {
    return this.userRepository.findBy({ id: In(ids) });
  }

  async getUserDataByIds(ids: number[]): Promise<any> {
    return await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.nickName', 'user.intraName', 'user.avatar'])
      .where('user.id IN (:...ids)', { ids: ids })
      .getMany();
  }

  private async createUniqueNickName(intraName: string) {
    const baseNickName = intraName.substring(0, 3);
    let nickName = '';
    let isUnique = false;

    while (!isUnique) {
      const randomNumbers = Math.floor(Math.random() * 100000)
        .toString()
        .padStart(5, '0');
      nickName = `${baseNickName}${randomNumbers}`;
      const existingUser = await this.userRepository.findOneBy({
        nickName: nickName,
      });
      isUnique = !existingUser;
    }
    return nickName;
  }

  async createUser(userPublicData: any): Promise<User> {
    const nickName = await this.createUniqueNickName(userPublicData.login);
    return await this.userRepository.save(
      User.create(userPublicData, nickName),
    );
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

    if (!detailed) {
      return toResponseUserDto(user);
    }
    const gameRecord = await this.gameRecordRepository.findOne({
      where: { user: { id: id } },
    });
    const orderedAchievements =
      await this.achievementService.getAchievementsInOrder(user.achievements);
    return toDetailResponseUserDto(
      user,
      orderedAchievements,
      (await gameRecord).rankScore,
    );
  }

  async findRelationById(id: number, targetId: number) {
    const user = await this.findOne(id);
    let blockStatus = 0;
    let followStatus = 0;

    if (await this.isBlocked(user, targetId)) {
      blockStatus = 1;
    }
    if (await this.followService.isRequestExisted(id, targetId))
      followStatus = 1;
    if (await this.followService.isFollow(id, targetId)) followStatus = 2;

    return {
      id: targetId,
      blockStatus: blockStatus,
      followStatus: followStatus,
    };
  }

  async isBlocked(user: User, targetId: number): Promise<boolean> {
    return user.blockIds.includes(targetId);
  }

  async block(user: User, targetId: number) {
    user.blockIds.push(targetId);
    await this.userRepository.update(user.id, { blockIds: user.blockIds });
  }

  async unblock(user: User, targetId: number) {
    user.blockIds = user.blockIds.filter((id) => id !== targetId);
    await this.userRepository.update(user.id, { blockIds: user.blockIds });
  }

  async saveProfileImage(id: number, nickName: string, filename: string) {
    const user = await this.userRepository.findOneBy({ id: id });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    if (nickName.length === 0) {
      nickName = user.nickName;
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
    if (nickName.length === 0) {
      nickName = user.nickName;
    }
    const avatarPath = join(__dirname, '..', '..', 'original', avatar);
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
    if (nickName.length === 0)
      throw new HttpException(
        '빈문자열은 닉네임 설정 불가',
        HttpStatus.BAD_REQUEST,
      );
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

  async searchUser(name: string, offset: number) {
    const rankQuery = `
    SELECT 
      "game_record"."user_id" AS "userId", 
      RANK() OVER (ORDER BY "game_record"."rank_score" DESC) as "rank"
    FROM 
      "game_record"
  `;
    const rawUsers = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.gameRecord', 'gameRecord')
      .leftJoinAndSelect(`(${rankQuery})`, 'rank', '"userId" = user.id')
      .select(['user.id', 'user.nickName', 'user.intraName', 'user.avatar'])
      .addSelect('rank.rank')
      .addSelect('gameRecord.rankScore')
      .addSelect('gameRecord.rankTotalCount')
      .where('user.intraName LIKE :name', { name: `%${name}%` })
      .orWhere('user.nickName LIKE :name', { name: `%${name}%` })
      .orderBy('gameRecord.rankScore', 'DESC')
      .offset(offset)
      .limit(PAGINATION_LIMIT)
      .getRawMany();

    const users = rawUsers.map((rawUser) => {
      return {
        id: rawUser.user_id,
        nickName: rawUser.user_nickName,
        intraName: rawUser.user_intraName,
        avatar: rawUser.user_avatar,
        ranking: rawUser.rank,
        rankScore: rawUser.gameRecord_rank_score,
        rankGameTotalCount: rawUser.gameRecord_rank_total_count,
      };
    });
    return users;
  }

  async blockUser(user: User, blockId: number) {
    if (!(await this.isBlocked(user, blockId))) {
      // const client = await this.chatGateway.getClientByUserId(user.id);
      // if (client) client.join('block-' + blockId);
      user.blockIds.push(blockId);
      await this.userRepository.update(user.id, { blockIds: user.blockIds });
    }
  }

  async unblockUser(user: User, unblockId: number) {
    if (await this.isBlocked(user, unblockId)) {
      // const client = await this.chatGateway.getClientByUserId(user.id);
      // if (client) client.leave('block-' + unblockId);
      user.blockIds = user.blockIds.filter((id) => id !== unblockId);
      await this.userRepository.update(user.id, { blockIds: user.blockIds });
    }
  }
  async set2fa(id: number) {
    const user = await this.findOne(id);
    if (user.two_factor_auth)
      throw new HttpException('이미 2fa 켜져있음', HttpStatus.BAD_REQUEST);
    await this.userRepository.update(id, { two_factor_auth: true });
    return toResponseUserDto(user);
  }
  async cancel2fa(id: number) {
    const user = await this.findOne(id);
    if (!user.two_factor_auth)
      throw new HttpException('이미 2fa 꺼져있음', HttpStatus.BAD_REQUEST);
    await this.userRepository.update(id, { two_factor_auth: false });
    return toResponseUserDto(user);
  }
}
