import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';

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
      client_id: 'u-s4t2ud-e80da690cddde3d' + 'a8e17af2a1458d99e28169a63558faf52a154b2d85d627ea1',
      client_secret: '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',
      redirect_uri: 'http://localhost:3000/auth/callback',
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
}
