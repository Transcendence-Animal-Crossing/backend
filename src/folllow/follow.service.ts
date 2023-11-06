import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Follow } from './entities/follow.entity';
import { Repository } from 'typeorm';
import { FollowRequest } from './entities/follow-request.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    @InjectRepository(FollowRequest)
    private readonly followRequestRepository: Repository<FollowRequest>,
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
    const reversedRequest = await this.isRequestExisted(sendTo, sendBy);
    if (reversedRequest && !reversedRequest.deletedAt) {
      await this.deleteRequest(sendTo, sendBy);
      const follow1 = await this.isFollowed(sendBy, sendTo);
      const follow2 = await this.isFollowed(sendTo, sendBy);
      if (follow1 && follow2) {
        //친구관계였다가 취소한경우
        if (follow1.deletedAt && follow2.deletedAt) {
          await this.followRepository.restore(follow1.id);
          await this.followRepository.restore(follow2.id);
          return 'restore friends';
        } else {
          throw new HttpException(
            'something wrong with follow',
            HttpStatus.CONFLICT,
          );
        }
      }
      await this.createFollows(sendBy, sendTo);
      return 'new freinds';
    }
    const existingRequest = await this.isRequestExisted(sendBy, sendTo);
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
    return 'follow request success';
  }

  async isRequestExisted(sendBy: number, sendTo: number) {
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
    const existingRequest = await this.isRequestExisted(sendBy, sendTo);
    if (existingRequest && !existingRequest.deletedAt) {
      await this.followRequestRepository.softDelete(existingRequest.id);
    } else {
      throw new HttpException(
        'No active follow request found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async isFollowed(sendBy: number, sendTo: number) {
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
    const follow1 = await this.isFollowed(sendBy, sendTo);
    const follow2 = await this.isFollowed(sendTo, sendBy);
    if (follow1 && follow2) {
      if (!follow1.deletedAt && !follow2.deletedAt) {
        await this.followRepository.softDelete(follow1.id);
        await this.followRepository.softDelete(follow2.id);
        return;
      }
    }
    throw new HttpException('delete failed', HttpStatus.CONFLICT);
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

  async findAllFriends(userId: number) {
    const friends = await this.followRepository
      .createQueryBuilder('follow')
      .leftJoinAndSelect('follow.following', 'following')
      .where('follow.follower = :userId', { userId })
      .select('follow.id')
      .addSelect('following.id')
      .addSelect('following.nickName')
      .addSelect('following.avatar')
      .getMany();

    return friends.map((fr) => ({
      friendId: fr.following.id,
      freindNickName: fr.following.nickName,
      freindProfile: fr.following.avatar,
    }));
  }
}
