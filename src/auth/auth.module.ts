import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { GameRecordModule } from 'src/gameRecord/game-record.module';
import { EmailVerification } from 'src/email/entities/emailVerification.entity';
import { EmailService } from 'src/email/email.service';
import { AchievementService } from 'src/achievement/achievement.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, EmailVerification]),
    forwardRef(() => UserModule),
    PassportModule,
    GameRecordModule,
    JwtModule.register({
      signOptions: { expiresIn: process.env.JWT_REFRESH_EXPIRE },
    }),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    EmailService,
    AchievementService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
