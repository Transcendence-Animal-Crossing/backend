import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, ObjectLiteral } from 'typeorm';
import { Standby } from './entities/standby.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QueueGateway } from './queue.gateway';
import { GameService } from '../game/game.service';
import {
  GameType,
  GAMETYPE_CLASSIC,
  GAMETYPE_RANK,
  GAMETYPE_SPECIAL,
} from '../game/const/game.type';

@Injectable()
export class QueueCron {
  constructor(
    private readonly dataSource: DataSource,
    private readonly queueGateWay: QueueGateway,
    private readonly gameService: GameService,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async matchCron(): Promise<void> {
    await this.dataSource.transaction('READ COMMITTED', async (manager) => {
      await this.match(manager, GAMETYPE_RANK);
      await this.match(manager, GAMETYPE_CLASSIC);
      await this.match(manager, GAMETYPE_SPECIAL);
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

    if (type === GAMETYPE_RANK) await this.rankMatch(manager, queue);
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
    const game = await this.gameService.initGame(userA.type);
    await this.sendMatchedEvent(userA, game);
    await this.sendMatchedEvent(userB, game);
    await manager.getRepository(Standby).remove(userA);
    await manager.getRepository(Standby).remove(userB);
  }

  private async sendMatchedEvent(user, game) {
    await this.queueGateWay.sendEventToClient(user.id, 'game-matched', {
      id: game.id,
    });
  }

  private isMatchable(a: ObjectLiteral, b: ObjectLiteral): boolean {
    return (
      a.matchableMinRank <= b.rankScore && a.matchableMaxRank >= b.rankScore
    );
  }

  private cacheMatchableRank(queue: ObjectLiteral[]) {
    for (let i = 0; i < queue.length; ++i) {
      const matchableDistance = this.matchableDistance(queue[i].createdAt);
      console.log('matchableDistance: ', matchableDistance);
      queue[i].matchableMinRank = queue[i].rankScore - matchableDistance;
      queue[i].matchableMaxRank = queue[i].rankScore + matchableDistance;
    }
  }

  private matchableDistance(createdAt: Date): number {
    const waitTime = (new Date().getTime() - createdAt.getTime()) / 1000;
    return 20 + Math.max(1, Math.floor(Math.log2(waitTime) * 10));
  }
}
