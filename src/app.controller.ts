import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  Post,
  Query,
  Render,
  Req,
} from '@nestjs/common';
import { AppService } from './app.service';
import { RoomService } from './room/room.service';
import { UserService } from './user/user.service';
import { Public } from './auth/guards/public';
import { AuthService } from './auth/auth.service';
import { FollowService } from './folllow/follow.service';
import { ChatService } from './chat/chat.service';
import { ClientService } from './ws/client.service';
import { QueueService } from './queue/queue.service';
import { GameRecord } from './gameRecord/entities/game-record';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly roomService: RoomService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly followService: FollowService,
    private readonly chatService: ChatService,
    private readonly clientService: ClientService,
    private readonly queueService: QueueService,
    @InjectRepository(GameRecord)
    private readonly gameRecordRepository: Repository<GameRecord>,
  ) {}

  /*
    아래 코드들은 전부 채팅 데모들을 위한 것들로 실제로는 필요 없음.
   */

  @Public()
  @Get('/')
  @Render('index')
  index(@Query('message') message: string) {
    return { message: message };
  }

  @Get('/user')
  getUsers() {
    return this.userService.findAll();
  }

  @Public()
  @Get('/login')
  @Render('login')
  login() {}

  @Public()
  @Get('/chat')
  @Render('chat')
  async chat(@Query('token') token: string) {
    const userId = this.authService.verifyAccessToken(token).id;
    const user = await this.userService.findOne(userId);
    return { user: user, token: token };
  }

  @Public()
  @Get('/queue')
  @Render('queue')
  async queue(@Query('token') token: string) {
    const userId = this.authService.verifyAccessToken(token).id;
    const record = await this.gameRecordRepository.findOneBy({ id: userId });
    return { record: record, token: token };
  }

  @Public()
  @Get('/me')
  async me(@Req() req) {
    const userId = this.authService.verifyAccessToken(req.cookies.jwt).id;
    return await this.userService.findOne(userId);
  }

  // 가짜 유저의 비밀번호 업데이트 용도
  @Public()
  @Patch('/password')
  async updatePassword(@Req() req, @Body() body) {
    console.log('body', body);
    await this.userService.updatePassword(body.id, body.password);
  }

  // friend-list 테스트 용도
  @Public()
  @Get('/friends')
  async getFriends(@Query('id') id: number) {
    const friends = await this.followService.getSimpleFriends(id);
    const friendsWithStatus = [];
    for (const friend of friends) {
      const status = 'ONLINE';
      const unReadMessages = await this.chatService.findUnReadMessageFromFriend(
        id,
        friend.id,
      );
      friendsWithStatus.push({
        ...friend,
        status,
        unReadMessages,
      });
    }
    return { status: HttpStatus.OK, body: friendsWithStatus };
  }

  // dm 테스트 용도
  @Public()
  @Post('/dm')
  async postChat(@Body() body) {
    await this.chatService.save({ ...body });
    return { status: HttpStatus.OK };
  }

  // chat 테스트 용도
  @Public()
  @Post('/dm-focus')
  async postChatFocus(@Body('userId') userId, @Body('targetId') targetId) {
    console.log('userId', userId, 'targetId', targetId);
    const beforeFocus: number = await this.clientService.getDMFocus(userId);
    if (beforeFocus) await this.chatService.updateLastRead(userId, beforeFocus);

    await this.clientService.changeDMFocus(userId, targetId);
    return { status: HttpStatus.OK };
  }

  // queue 테스트 용도
  @Public()
  @Post('/queue')
  async postQueue(@Body('userId') userId, @Body() body) {
    await this.queueService.join(userId, { ...body });
    return { status: HttpStatus.OK };
  }
}
