import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';

enum Achievement {
  SignUp = '회원가입 완료하기',
  FriendRequest = '친구추가 요청하기',
  FiveFriends = '친구 5명 만들기',
  GeneralGameStart = '일반게임 시작하기',
  RankGameStart = '랭킹게임 시작하기',
  ChattingJoin = '채팅방 참여하기',
  AllAchievements = '모든업적 달성하기',
}

@Injectable()
export class AchievementService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private async addAchievement(user: User, achievement: Achievement) {
    if (!user.achievements.includes(achievement)) {
      user.achievements.push(achievement);
      await this.userRepository.update(user.id, {
        achievements: user.achievements,
      });
    }
  }

  async getFollowRequestAchievement(user: User) {
    await this.addAchievement(user, Achievement.FriendRequest);
  }

  async getSignUpAchievement(user: User) {
    await this.addAchievement(user, Achievement.SignUp);
  }

  async getFiveFriendsAchievement(user: User) {
    await this.addAchievement(user, Achievement.FiveFriends);
  }

  async getGeneralGameAchievement(user: User) {
    await this.addAchievement(user, Achievement.GeneralGameStart);
  }

  async getRankGameAchievement(user: User) {
    await this.addAchievement(user, Achievement.RankGameStart);
  }

  async getChattingJoin(user: User) {
    await this.addAchievement(user, Achievement.ChattingJoin);
  }

  async hasAllAchievements(user: User) {
    if (user.achievements.length === 6)
      await this.addAchievement(user, Achievement.AllAchievements);
  }
}
