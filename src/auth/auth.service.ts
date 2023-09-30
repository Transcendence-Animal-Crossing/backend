import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { User } from "../user/entities/user.entity";
import * as bcrypt from 'bcryptjs';

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

  async getProfile(accessToken: string): Promise<any> {
    const response = await axios.get('https://api.intra.42.fr/v2/me', {
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
    });
    return response.data;
  }

  verifyJwt(token: string) {
    return this.jwtService.verify(token);
  }

  async signJwt(userId: number): Promise<string> {
    const payload = { id: userId };
    return this.jwtService.sign(payload);
  }

  async validateUser(id: number, password: string): Promise<User> {
    const user = await this.userService.findOne(id);
    if (!user) {
      throw new NotFoundException(`There is no user under this username`);
    }

    // const passwordEquals = await bcrypt.compare(password, user.password);
    // if (passwordEquals) return user;
    if (password === user.password) return user;

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
}
