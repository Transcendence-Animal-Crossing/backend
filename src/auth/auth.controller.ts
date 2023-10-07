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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './guards/public';
import { UserService } from '../user/user.service';
import { Request, Response } from 'express';
import { User } from '../user/entities/user.entity';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

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
    let tokens: any;
    try {
      const accessToken = await this.authService.getAccessToken(code);

      const userPublicData: any =
        await this.authService.getProfile(accessToken);
      const existingUser = await this.userService.findByName(
        userPublicData.intraName,
      );
      let user: User;
      if (!existingUser) {
        user = await this.userService.createOrUpdateUser(userPublicData);
        //console.log('new user', user);
      } else {
        user = existingUser;
        //console.log('already existed', user);
      }
      tokens = await this.authService.generateTokens(user.id.toString());
    } catch (AxiosError) {
      throw new HttpException('Invalid or Already Used code', 400);
    }
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return tokens;
  }

  @Public()
  @Redirect(
    // 'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-e80da690cddde3da8e17af2a1458d99e28169a63558faf52a154b2d85d627ea1&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback&response_type=code',
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
  @Post('/signUp')
  async singUp(
    @Body() userDto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.signUp(userDto);
    if (!tokens) {
      throw new HttpException('you must log in at 42', HttpStatus.BAD_REQUEST);
    }

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return tokens;
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

  @Post('/tokenUpdate')
  async updateTokens(@Req() req: Request) {
    const { refreshToken } = req.cookies;
    const accessToken = await this.authService.updateAccessToken(refreshToken);
    if (!accessToken) {
      throw new HttpException('token update failed', HttpStatus.UNAUTHORIZED);
    }

    return accessToken;
  }
}
