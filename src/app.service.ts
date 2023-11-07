import { Inject, Injectable, Logger } from '@nestjs/common';
import { ILike, Repository } from 'typeorm';
import { User } from './user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { GameRecord } from './gameRecord/entities/game-record';
import { Game } from './game/entities/game.entity';
import { Follow } from './folllow/entities/follow.entity';
import { FollowRequest } from './folllow/entities/follow-request.entity';
import { GameService } from './game/game.service';
import { GameRecordService } from './gameRecord/game-record.service';
import { UserService } from './user/user.service';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(GameRecord)
    private readonly gameRecordRepository: Repository<GameRecord>,
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    @InjectRepository(FollowRequest)
    private readonly followRequestRepository: Repository<FollowRequest>,
    private readonly gameRecordService: GameRecordService,
    private readonly userService: UserService,
  ) {}

  private readonly logger: Logger = new Logger(AppService.name);

  async init() {
    try {
      await this.initUser();
      await this.initFollow();
      await this.initBlock();
      const count = await this.gameRepository.count();
      if (count < 30) {
        await this.initGame();
      }
    } catch (e) {
      this.logger.log('Application Init Fail by ' + e);
      return;
    }

    this.logger.log('Application Init Success');
  }
  async initUser() {
    for (let i = 0; i < 20; i++) {
      const newUser = this.userRepository.create({
        id: i,
        nickName: `User${i}`,
        intraName: `IntraUser${i}`,
        password:
          '$2a$07$HcXHIu2PIB0nG4/850RkRurOAmqTgQ77.9Z975AKgKN/.Kl.eeQJe',
        avatar: 'original/profile2.png',
        achievements: [],
        blockIds: [],
        two_factor_auth: false,
      });
      await this.userRepository.save(newUser);
      let gameRecord = await this.gameRecordRepository.findOne({
        where: {
          user: { id: i },
        },
      });
      if (!gameRecord) {
        gameRecord = GameRecord.create(newUser);
        gameRecord.rankScore =
          Math.floor(Math.random() * (10000 - 100 + 1)) + 100;
      }
      await this.gameRecordRepository.save(gameRecord);
    }
  }

  async initFollow() {
    for (let i = 0; i <= 5; i++) {
      for (let j = 0; j <= 5; j++) {
        if (i !== j) {
          const exists = await this.followRepository.findOne({
            where: {
              following: { id: i },
              follower: { id: j },
            },
          });
          if (!exists) {
            const follow = this.followRepository.create({
              following: { id: i },
              follower: { id: j },
            });
            await this.followRepository.save(follow);
          }
        }
      }
    }
    for (let i = 11; i < 20; i++) {
      const targetUserId = i - 1;
      if (targetUserId >= 11) {
        const exists = await this.followRequestRepository.findOne({
          where: {
            sendBy: { id: i },
            sendTo: { id: targetUserId },
          },
        });

        if (!exists) {
          const followRequest = this.followRequestRepository.create({
            sendBy: { id: i },
            sendTo: { id: targetUserId },
          });
          await this.followRequestRepository.save(followRequest);
        }
      }
    }
  }

  async initGame() {
    const totalGames = 10; // 생성할 총 게임 수
    const userIds = Array.from({ length: 20 }, (_, index) => index); // 0부터 19까지의 사용자 ID 배열

    for (let gameIndex = 0; gameIndex < totalGames; gameIndex++) {
      let playerIndices = this.getRandomPlayerIndices(userIds);
      const winnerId = userIds[playerIndices[0]];
      const loserId = userIds[playerIndices[1]];
      const winnerScore = Math.floor(Math.random() * (60 - 50 + 1)); // 0~50
      const loserScore = Math.floor(Math.random() * winnerScore); // 패자 점수: 0 ~ winnerScore - 1
      const playTime = Math.floor(Math.random() * (3600 - 300 + 1)) + 300; // 게임 시간: 300초(5분) ~ 3600초(1시간)
      const isRank = Math.random() > 0.5; // 랭크 게임 여부: 50% 확률

      const newGame = await this.gameRepository.create({
        winnerId,
        loserId,
        winnerScore,
        loserScore,
        playTime,
        isRank,
      });

      await this.gameRepository.save(newGame);
      await this.gameRecordService.updateGameRecord(
        newGame.winnerId,
        newGame.loserId,
        newGame.isRank,
      );
    }
  }
  getRandomPlayerIndices(userIds: number[]): number[] {
    let indexSet = new Set<number>();
    while (indexSet.size < 2) {
      let randomIndex = Math.floor(Math.random() * userIds.length);
      indexSet.add(randomIndex);
    }
    return Array.from(indexSet);
  }

  async initBlock() {
    for (let i = 11; i < 20; i++) {
      const user = await this.userService.findOne(0);
      await this.userService.blockUser(user, i);
    }
  }
}
