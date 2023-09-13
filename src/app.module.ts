import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

// import { ChatModule } from './chat/chat.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { GameModule } from './game/game.module';
import { ChatModule } from "./chat/chat.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
// import { RoomModule } from './room/room.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mariadb',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),
    ChatModule,
    UserModule,
    AuthModule,
    GameModule,
    // RoomModule,
  ],
  providers: [AppService],
  controllers: [AppController],
})
export class AppModule {}
