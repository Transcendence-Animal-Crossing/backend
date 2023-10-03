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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './guards/public';
import { UserService } from '../user/user.service';
import { Request, Response } from 'express';
import { User } from '../user/entities/user.entity';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  @Public()
  @Get('/callback')
  async oauth2Callback(
    @Query('code') code: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    let accessToken: string;
    try {
      accessToken = await this.authService.getAccessToken(code);
    } catch (AxiosError) {
      throw new HttpException('Invalid or Already Used code', 400);
    }

    const userPublicData: any = await this.authService.getProfile(accessToken);
    // console.log(userPublicData);
    const user: User =
      await this.userService.createOrUpdateUser(userPublicData);
    const jwt: string = await this.authService.signJwt(user.id);
    res.cookie('jwt', jwt);
    console.log(jwt);
    return jwt;
  }

  // 클라이언트에서 로그인 버튼을 누르면 42 oauth2 로그인 페이지로 리다이렉트
  // 42 oauth2 로그인 페이지에서 로그인을 하면 42 oauth2 콜백 페이지로 리다이렉트
  // 고로 아래 /login 은 클라이언트에서 해줄 것이므로 나중에는 지워질 운명
  @Public()
  @Redirect(
    // 'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-e80da690cddde3da8e17af2a1458d99e28169a63558faf52a154b2d85d627ea1&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback&response_type=code',
    'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-e80da690cddde3da8e17af2a1458d99e28169a63558faf52a154b2d85d627ea1&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fauth%2Fcallback&response_type=code',
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
  @Post('/signUp')
  async singUp(@Body('id') id: number, @Body('password') password: string) {
    const user = await this.userRepository.create({
      id: id,
      password: password,
      nickName: 'test' + id,
      intraName: 'test' + id,
      two_factor_auth: false,
    });
    await this.userRepository.save(user);
  }

  @Public()
  @Post('/signIn')
  async singIn(
    @Body('id') id: number,
    @Body('password') password: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log('id: ' + id);
    console.log('password: ' + password);
    const user = await this.userService.findOne(id);

    if (!user || user.password !== password)
      throw new HttpException('Invalid id or password', 400);
    const token = await this.authService.signJwt(id);

    res.cookie('jwt', token);

    res.redirect('http://localhost:8080/chat?token=' + token);
  }
}
