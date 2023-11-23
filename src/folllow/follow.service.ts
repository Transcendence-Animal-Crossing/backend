import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Follow } from './entities/follow.entity';
import { Brackets, Repository } from 'typeorm';
import { FollowRequest } from './entities/follow-request.entity';
import { User } from 'src/user/entities/user.entity';
import { UserData } from '../room/data/user.data';
import { PAGINATION_LIMIT } from 'src/common/constants';
import { AchievementService } from 'src/achievement/achievement.service';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    @InjectRepository(FollowRequest)
    private readonly followRequestRepository: Repository<FollowRequest>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly achievementService: AchievementService,
  ) {}

  async createFollows(sendBy: number, sendTo: number) {
    const follow1 = new Follow();
    const follow2 = new Follow();

    follow1.follower = { id: sendBy } as User;
    follow1.following = { id: sendTo } as User;
    follow2.following = { id: sendBy } as User;
    follow2.follower = { id: sendTo } as User;

    await this.followRepository.save(follow1);
    await this.followRepository.save(follow2);
  }

  async createRequest(sendBy: number, sendTo: number) {
    const reversedRequest = await this.isAnyRequestExisted(sendTo, sendBy);
    if (reversedRequest && !reversedRequest.deletedAt) {
      await this.deleteRequest(sendTo, sendBy);
      const follow1 = await this.findFollowWithDeleted(sendBy, sendTo);
      const follow2 = await this.findFollowWithDeleted(sendTo, sendBy);
      if (follow1 && follow2) {
        //친구관계였다가 취소한경우
        if (follow1.deletedAt && follow2.deletedAt) {
          await this.followRepository.restore(follow1.id);
          await this.followRepository.restore(follow2.id);
          return HttpStatus.CREATED;
        } else {
          throw new HttpException(
            'something wrong with follow',
            HttpStatus.CONFLICT,
          );
        }
      }
      await this.createFollows(sendBy, sendTo);
      const sendByFollowCount = await this.getFollowCount(sendBy);
      const sendToFollowCount = await this.getFollowCount(sendTo);
      if (sendByFollowCount == 5) {
        const user = await this.userRepository.findOneBy({ id: sendBy });
        await this.achievementService.addFiveFriendsAchievement(user);
      }
      if (sendToFollowCount == 5) {
        const user = await this.userRepository.findOneBy({ id: sendTo });
        await this.achievementService.addFiveFriendsAchievement(user);
      }
      return HttpStatus.CREATED;
    }
    const existingRequest = await this.isAnyRequestExisted(sendBy, sendTo);
    if (existingRequest) {
      if (existingRequest.deletedAt) {
        await this.followRequestRepository.restore(existingRequest.id);
      } else {
        throw new HttpException(
          'already existing request',
          HttpStatus.BAD_REQUEST,
        );
      }
    } else {
      const followRequest = new FollowRequest();
      followRequest.sendBy = { id: sendBy } as User;
      followRequest.sendTo = { id: sendTo } as User;
      await this.followRequestRepository.save(followRequest);
    }
    return HttpStatus.OK;
  }

  async isRequestExisted(sendBy: number, sendTo: number) {
    const existingRequest = await this.followRequestRepository.findOne({
      where: {
        sendBy: { id: sendBy },
        sendTo: { id: sendTo },
      },
    });
    return existingRequest;
  }

  async isAnyRequestExisted(sendBy: number, sendTo: number) {
    const existingRequest = await this.followRequestRepository.findOne({
      where: {
        sendBy: { id: sendBy },
        sendTo: { id: sendTo },
      },
      withDeleted: true,
    });
    return existingRequest;
  }

  async deleteRequest(sendBy: number, sendTo: number) {
    const existingRequest = await this.isAnyRequestExisted(sendBy, sendTo);
    if (existingRequest && !existingRequest.deletedAt) {
      await this.followRequestRepository.softDelete(existingRequest.id);
    } else {
      throw new HttpException(
        'No active follow request found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async isFollow(sendBy: number, sendTo: number) {
    return await this.followRepository.exist({
      where: {
        follower: { id: sendBy },
        following: { id: sendTo },
      },
    });
  }

  async findFollowWithDeleted(sendBy: number, sendTo: number) {
    const follow = await this.followRepository.findOne({
      where: {
        follower: { id: sendBy },
        following: { id: sendTo },
      },
      withDeleted: true,
    });
    return follow;
  }

  async deleteFollow(sendBy: number, sendTo: number) {
    const follow1 = await this.findFollowWithDeleted(sendBy, sendTo);
    const follow2 = await this.findFollowWithDeleted(sendTo, sendBy);
    if (!follow1 || !follow2)
      throw new HttpException('not found', HttpStatus.NOT_FOUND);

    if (!follow1.deletedAt && !follow2.deletedAt) {
      await this.followRepository.softDelete(follow1.id);
      await this.followRepository.softDelete(follow2.id);
      return;
    }
  }

  async findAllSentTo(userId: number) {
    const followRequests = await this.followRequestRepository
      .createQueryBuilder('followRequest')
      .where('followRequest.sendTo = :userId', { userId })
      .leftJoin('followRequest.sendBy', 'sendBy')
      .select([
        'followRequest.id',
        'sendBy.id',
        'sendBy.nickName',
        'sendBy.intraName',
      ])
      .getMany();

    return followRequests.map((fr) => ({
      sendBy: fr.sendBy.id,
      nickName: fr.sendBy.nickName,
      intraName: fr.sendBy.intraName,
    }));
  }

  async getSimpleFriends(userId: number) {
    const friends = await this.followRepository
      .createQueryBuilder('follow')
      .leftJoinAndSelect('follow.following', 'following')
      .where('follow.follower = :userId', { userId })
      .select('follow.id')
      .addSelect('following.id')
      .addSelect('following.nickName')
      .addSelect('following.intraName')
      .addSelect('following.avatar')
      .getMany();

    return friends.map((fr) =>
      UserData.create(
        fr.following.id,
        fr.following.nickName,
        fr.following.intraName,
        fr.following.avatar,
      ),
    );

    // return friends.map((fr) => ({
    //   id: fr.following.id,
    //   freindNickName: fr.following.nickName,
    //   freindIntraName: fr.following.intraName,
    //   freindProfile: fr.following.avatar,
    // }));
  }

  async findFriendsByName(id: number, name: string) {
    const rawFriends = await this.followRepository
      .createQueryBuilder('follow')
      .leftJoinAndSelect('follow.following', 'user')
      .select([
        'follow.id',
        'user.id',
        'user.intraName',
        'user.nickName',
        'user.avatar',
      ])
      .where('follow.followerId = :followerId', { followerId: id })
      .andWhere(
        new Brackets((qb) => {
          qb.where('user.intraName LIKE :name', { name: `%${name}%` }).orWhere(
            'user.nickName LIKE :name',
            { name: `%${name}%` },
          );
        }),
      )
      .limit(PAGINATION_LIMIT)
      .getMany();

    const freinds = rawFriends.map((rawFriend) => {
      return {
        followId: rawFriend.id,
        userId: rawFriend.following.id,
        nickName: rawFriend.following.nickName,
        intraName: rawFriend.following.intraName,
        avatar: rawFriend.following.avatar,
      };
    });
    return freinds;
  }

  private async getFollowCount(userId: number): Promise<number> {
    return await this.followRepository.count({
      where: { follower: { id: userId } },
    });
  }
}
