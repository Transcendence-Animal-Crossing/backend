import { Injectable, Logger } from '@nestjs/common';
import { DataSource, EntityManager, ObjectLiteral } from 'typeorm';
import { Standby } from './entities/standby.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QueueGateway } from './queue.gateway';
import { GameType } from '../game/enum/game.type.enum';
import { User } from '../user/entities/user.entity';
import { Game } from '../game/model/game.model';
import { GameRepository } from '../game/game.repository';
import { ClientRepository } from '../ws/client.repository';
import { Status } from '../ws/const/client.status';
import { ChatGateway } from '../chat/chat.gateway';
import { UserData } from '../room/data/user.data';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class QueueCron {
  private readonly logger = new Logger(QueueCron.name);
  constructor(
    private readonly dataSource: DataSource,
    private readonly queueGateWay: QueueGateway,
    private readonly chatGateWay: ChatGateway,
    private readonly gameRepository: GameRepository,
    private readonly clientRepository: ClientRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async matchCron(): Promise<void> {
    await this.dataSource.transaction('READ COMMITTED', async (manager) => {
      await this.match(manager, GameType.RANK);
      await this.match(manager, GameType.NORMAL);
      await this.match(manager, GameType.HARD);
    });
  }

  private async match(manager: EntityManager, type: GameType) {
    const data = await manager
      .getRepository(Standby)
      .createQueryBuilder('standby')
      .select('standby.id')
      .addSelect('standby.rankScore')
      .addSelect('standby.createdAt')
      .where('standby.type = :type', { type })
      .orderBy('standby.createdAt', 'ASC')
      .getMany();
    const queue: Standby[] = data.map((d) => {
      return Standby.createWithDate(d.id, type, d.rankScore, d.createdAt);
    });

    if (type === GameType.RANK) await this.rankMatch(manager, queue);
    else await this.generalMatch(manager, queue);
  }

  private async generalMatch(manager: EntityManager, queue) {
    while (queue.length >= 2) {
      try {
        const matched = queue.splice(0, 2);
        await this.processMatchedUser(manager, matched[0], matched[1]);
      } catch (e) {
        console.log(e);
      }
    }
  }

  private async rankMatch(manager: EntityManager, queue: Standby[]) {
    queue.sort((a, b) => {
      return a.rankScore - b.rankScore;
    });
    this.cacheMatchableRank(queue);
    while (queue.length >= 2) {
      const standardUser = queue.shift();
      await this.findMatchableUser(manager, queue, standardUser);
    }
  }

  /**
   * @description
   * standardUser의 matchable한 범위를 벗어나면 break
   * 쌍방으로 matchable 하면 매칭하고 break
   */

  private async findMatchableUser(
    manager: EntityManager,
    queue: Standby[],
    standardUser: Standby,
  ) {
    for (let i = 0; i < queue.length; ++i) {
      if (!this.isMatchable(standardUser, queue[i])) break;
      if (this.isMatchable(queue[i], standardUser)) {
        const matchedUser = queue.splice(i, 1)[0];
        --i;
        await this.processMatchedUser(manager, standardUser, matchedUser);
        break;
      }
    }
  }

  private async processMatchedUser(
    manager: EntityManager,
    userA: Standby,
    userB: Standby,
  ) {
    const leftUser = await manager
      .getRepository(User)
      .findOneBy({ id: userA.id });
    const rightUser = await manager
      .getRepository(User)
      .findOneBy({ id: userB.id });

    const game = Game.create(leftUser, rightUser, userA.type);
    await this.gameRepository.save(game);
    await this.gameRepository.userJoin(game.id, userA.id);
    await this.gameRepository.userJoin(game.id, userB.id);
    await this.clientRepository.saveUserStatus(userA.id, Status.IN_GAME);
    await this.sendMatchedEvent(leftUser, game);
    await this.sendMatchedEvent(rightUser, game);
    await manager.getRepository(Standby).remove(userA);
    await manager.getRepository(Standby).remove(userB);

    setTimeout(async () => {
      this.eventEmitter.emit('validate.game', game.id);
    }, 5000);
  }

  private async sendMatchedEvent(user: User, game) {
    await this.queueGateWay.sendEventToClient(user.id, 'queue-matched', {
      id: game.id,
    });
    await this.chatGateWay.sendProfileUpdateToFriends(UserData.from(user));
  }

  private isMatchable(a: ObjectLiteral, b: ObjectLiteral): boolean {
    return (
      a.matchableMinRank <= b.rankScore && a.matchableMaxRank >= b.rankScore
    );
  }

  private cacheMatchableRank(queue: ObjectLiteral[]) {
    for (let i = 0; i < queue.length; ++i) {
      const matchableDistance = this.matchableDistance(queue[i].createdAt);
      queue[i].matchableMinRank = queue[i].rankScore - matchableDistance;
      queue[i].matchableMaxRank = queue[i].rankScore + matchableDistance;
    }
  }

  private matchableDistance(createdAt: Date): number {
    const waitTime = (new Date().getTime() - createdAt.getTime()) / 1000;
    return 20 + Math.max(1, Math.floor(Math.log2(waitTime) * 10));
  }
}
