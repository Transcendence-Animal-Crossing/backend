import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { User } from '../user/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { LoginUserDto } from 'src/user/dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async getAccessToken(code: string): Promise<any> {
    const getTokenUrl: string = 'https://api.intra.42.fr/oauth/token';
    const request = {
      code: code,
      grant_type: 'authorization_code',
      client_id: process.env.OAUTH2_42_CLIENT_ID,
      client_secret: process.env.OAUTH2_42_CLIENT_SECRET,
      redirect_uri: process.env.OAUTH2_42_REDIRECT_URI,
    };
    const response = await axios.post(getTokenUrl, request);
    return response.data.access_token;
  }

  async signIn(userDto: LoginUserDto) {
    const user = await this.validateUser(userDto);
    const tokens = await this.generateTokens(user.id.toString());
    return tokens;
  }

  async getProfile(accessToken: string): Promise<any> {
    const response = await axios.get('https://api.intra.42.fr/v2/me', {
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    });
    return response.data;
  }

  // verifyJwt(token: string) {
  //   return this.jwtService.verify(token, {
  //     ignoreExpiration: false,
  //   });
  // }

  async signJwt(userId: number): Promise<string> {
    const payload = { id: userId };
    return this.jwtService.sign(payload);
  }

  async validateUser(userDto: LoginUserDto): Promise<User> {
    const user = await this.userService.findOneByIntraName(userDto.intraName);
    if (!user) {
      throw new NotFoundException(
        `로그인 실패 인트라 네임 없음~ There is no user under this username`,
      );
    }

    const passwordEquals = await bcrypt.compare(
      userDto.password,
      user.password,
    );
    if (passwordEquals) return user;

    throw new UnauthorizedException({ message: 'Incorrect password' });
  }

  verifyAccessToken(accessToken: string) {
    try {
      const payload = this.jwtService.verify(accessToken, {
        secret: process.env.JWT_ACCESS_SECRET,
      });

      return payload;
    } catch (err) {
      return null;
    }
  }
  verifyRefreshToken(refreshToken: string) {
    const payload = this.jwtService.verify(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    });
    return payload;
  }

  async generateTokens(id: string) {
    const payload = { id };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRE,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRE,
    });
    const tokens = { accessToken, refreshToken };

    return tokens;
  }

  async updateAccessToken(refreshToken: string) {
    try {
      const user = this.verifyRefreshToken(refreshToken);
      const tokens = await this.generateTokens(user.id.toString());
      return tokens.accessToken;
    } catch (e) {
      return null;
    }
  }
}
