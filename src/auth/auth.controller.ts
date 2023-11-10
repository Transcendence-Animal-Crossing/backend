import {
  Controller,
  Get,
  Redirect,
  Query,
  Req,
  Res,
  HttpException,
  Post,
  Body,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './guards/public';
import { UserService } from '../user/user.service';
import { Request, Response } from 'express';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginUserDto } from 'src/user/dto/login-user.dto';
import { GameRecordService } from 'src/gameRecord/game-record.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly gameRecordService: GameRecordService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  @Public()
  @Get('/callback') //백엔드 데모용 삭제 예정
  async oauth2Callback(
    @Query('code') code: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    let tokens: any;
    let user: User;
    try {
      const accessToken = await this.authService.getAccessToken(code);

      const userPublicData: any =
        await this.authService.getProfile(accessToken);
      const existingUser = await this.userService.findByName(
        userPublicData.login,
      );

      if (!existingUser) {
        user = await this.userService.createUser(userPublicData);
        await this.gameRecordService.initGameRecord(user);
        //console.log('new user', user);
      } else {
        user = existingUser;
        //console.log('already existed', user);
      }
      tokens = await this.authService.generateTokens(user.id.toString());
    } catch (AxiosError) {
      throw new HttpException(
        'Invalid or Already Used code',
        HttpStatus.UNAUTHORIZED,
      );
    }
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.setHeader('Authorization', 'Bearer ' + tokens.accessToken);
    return {
      id: user.id,
      nickName: user.nickName,
      intraName: user.intraName,
      avatar: user.avatar,
    };
  }

  @Public()
  @Post('/login')
  async loginCallBack(
    @Body('accessToken') accessToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    let tokens: any;
    let user: User;
    try {
      const userPublicData: any =
        await this.authService.getProfile(accessToken);
      // console.log('userPublicData', userPublicData);
      const existingUser = await this.userService.findByName(
        userPublicData.login,
      );

      if (!existingUser) {
        user = await this.userService.createUser(userPublicData);
        await this.gameRecordService.initGameRecord(user);
        res.status(201);
      } else {
        user = existingUser;
        res.status(200);
      }
      tokens = await this.authService.generateTokens(user.id.toString());
    } catch (AxiosError) {
      throw new HttpException(
        'Invalid or Already Used code',
        HttpStatus.UNAUTHORIZED,
      );
    }
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.setHeader('Authorization', 'Bearer ' + tokens.accessToken);
    return {
      id: user.id,
      nickName: user.nickName,
      intraName: user.intraName,
      avatar: user.avatar,
    };
  }

  // 클라이언트에서 로그인 버튼을 누르면 42 oauth2 로그인 페이지로 리다이렉트
  // 42 oauth2 로그인 페이지에서 로그인을 하면 42 oauth2 콜백 페이지로 리다이렉트
  // 고로 아래 /login 은 클라이언트에서 해줄 것이므로 나중에는 지워질 운명
  @Public()
  @Redirect(
    //'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-e80da690cddde3da8e17af2a1458d99e28169a63558faf52a154b2d85d627ea1&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback&response_type=code',
    'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-d927cd123502f27db21ee7ead26256f9fffb935090debfe592a3658c6bdefea0&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fauth%2Fcallback&response_type=code',
    302,
  )
  @Get('/login')
  async oauth2Login() {}

  @Get('/profile')
  getProfile(@Req() req) {
    console.log(req.user);
    return req.user;
  }

  @Post('/update')
  async updatePassword(@Req() req, @Body('password') password: string) {
    const user = await this.userService.findOne(req.user.id);
    console.log(password);
    user.password = password;
    await this.userRepository.save(user);
  }

  @Public()
  @Post('/demoSignUp')
  async demoSingUp(
    @Body('id') id: number,
    @Body('password') password: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.userRepository.create({
      id: id,
      password: password,
      nickName: 'tester' + id,
      intraName: 'tester' + id,
      avatar: '',
      two_factor_auth: false,
      achievements: [],
      blockIds: [],
    });
    try {
      await this.userRepository.save(user);
    } catch (error) {
      res.redirect('http://localhost:8080?message=Already Used ID!');
      return;
    }
    res.redirect('http://localhost:8080/login');
  }

  @Public()
  @Post('/demoSignIn')
  async demoSingIn(
    @Body('id') id: number,
    @Body('password') password: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.userService.findOne(id);

    if (!user || user.password !== password)
      throw new HttpException(
        'Invalid id or password',
        HttpStatus.UNAUTHORIZED,
      );
    const token = await this.authService.signJwt(id);

    res.cookie('jwt', token);

    res.redirect('http://localhost:8080/chat?token=' + token);
  }

  @Public()
  @Post('/signIn')
  async singIn(
    @Body() userDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.signIn(userDto);
    const user = await this.userService.findOneByIntraName(userDto.intraName);
    if (!tokens) {
      throw new HttpException('token failed', HttpStatus.BAD_REQUEST);
    }

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.setHeader('Authorization', 'Bearer ' + tokens.accessToken);
    console.log('token', tokens);
    return {
      id: user.id,
      nickName: user.nickName,
      intraName: user.intraName,
      avatar: user.avatar,
    };
  }

  @Public()
  @Get('/token')
  async updateTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken } = req.cookies;
    const accessToken = await this.authService.updateAccessToken(refreshToken);
    if (!accessToken) {
      throw new HttpException('token update failed', HttpStatus.UNAUTHORIZED);
    }
    res.setHeader('Authorization', 'Bearer ' + accessToken);
    res.status(HttpStatus.OK);
    res.send();
  }

  //verifyaccesstoken 테스트 지워야함
  @Get('test')
  test(@Headers('authorization') authHeader: string) {
    const token = authHeader && authHeader.split(' ')[1];

    const payload = this.authService.verifyAccessToken(token);
    console.log('payload', payload);
  }
}
