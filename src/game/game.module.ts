import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameService } from './game.service';
import { Game } from './entities/game.entity';
import { GameController } from './game.controller';
@Module({
  imports: [TypeOrmModule.forFeature([Game])],
  providers: [GameService],
  controllers: [GameController],
  exports: [GameService],
})
export class GameModule {}
