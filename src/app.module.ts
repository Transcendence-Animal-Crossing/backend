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
import { User } from './user/entities/user.entity';
import { UserService } from './user/user.service';
import { GameService } from './game/game.service';
import { Game } from './game/entities/game.entity';
import { GameRecord } from './gameRecord/entities/game-record';
import { GameRecordModule } from './gameRecord/game-record.module';
import { GameRecordService } from './gameRecord/game-record.service';
import { FollowRequest } from './folllow/entities/follow-request.entity';
import { FollowService } from './folllow/follow.service';
import { Follow } from './folllow/entities/follow.entity';

@Module({
  imports: [
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
    TypeOrmModule.forFeature([User, Game, GameRecord, Follow, FollowRequest]),
    ChatModule,
    UserModule,
    AuthModule,
    RoomModule,
    FollowModule,
    GameRecordModule,
    GameModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    AppService,
    UserService,
    GameRecordService,
    GameService,
    FollowService,
  ],
  controllers: [AppController],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly appService: AppService) {}
  onApplicationBootstrap() {
    this.appService.init();
  }
}
