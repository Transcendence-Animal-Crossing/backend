import { TypeOrmModule } from '@nestjs/typeorm';
import { Module, OnApplicationBootstrap } from '@nestjs/common';

import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { GameModule } from './game/game.module';
import { ChatModule } from './chat/chat.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { RoomModule } from './room/room.module';
import { CacheModule } from '@nestjs/cache-manager';
import { FollowModule } from './folllow/follow.module';
import { WSModule } from './ws/ws.module';
import { User } from './user/entities/user.entity';
import { UserService } from './user/user.service';
import { GameHistoryService } from './game/game-history.service';
import { GameHistory } from './game/entities/game-history.entity';
import { GameRecord } from './gameRecord/entities/game-record';
import { GameRecordModule } from './gameRecord/game-record.module';
import { GameRecordService } from './gameRecord/game-record.service';
import { FollowRequest } from './folllow/entities/follow-request.entity';
import { FollowService } from './folllow/follow.service';
import { Follow } from './folllow/entities/follow.entity';
import { QueueModule } from './queue/queue.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Message } from './chat/entity/message.entity';
import { MessageHistory } from './chat/entity/message-history.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    CacheModule.register({
      ttl: null,
      max: 1000,
      isGlobal: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: process.env.NODE_ENV === 'development' ? '.env.dev' : '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
      //logging: true,
    }),
    TypeOrmModule.forFeature([
      User,
      GameHistory,
      GameRecord,
      Follow,
      FollowRequest,
      Message,
      MessageHistory,
    ]),
    ChatModule,
    UserModule,
    AuthModule,
    RoomModule,
    FollowModule,
    WSModule,
    GameRecordModule,
    GameModule,
    GameRecordModule,
    GameModule,
    QueueModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    AppService,
    UserService,
    GameRecordService,
    GameHistoryService,
    FollowService,
  ],
  controllers: [AppController],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly appService: AppService) {}
  async onApplicationBootstrap() {
    await this.appService.initDB();
  }
}
