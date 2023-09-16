import { Controller, Get, Redirect, Query, Req, Res, HttpException } from "@nestjs/common";
import { AuthService } from './auth.service';
import { Public } from './guards/public';
import { UserService } from '../user/user.service';
import { Request, Response } from 'express';
import { User } from "../user/entities/user.entity";

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
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
    const user: User =
      await this.userService.createOrUpdateUser(userPublicData);
    const jwt: string = await this.authService.signJwt(user.id);
    res.cookie('jwt', jwt);
    console.log(jwt);
    return jwt;
  }

  @Public()
  @Redirect(
    'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-e80da690cddde3da8e17af2a1458d99e28169a63558faf52a154b2d85d627ea1&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fcallback&response_type=code',
    302,
  )
  @Get('/login')
  async oauth2Login() {}

  @Get('/profile')
  getProfile(@Req() req) {
    console.log(req.user);
    return req.user;
  }
}
