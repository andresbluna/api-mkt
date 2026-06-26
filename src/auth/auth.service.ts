import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../user/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.validateUser(email, password);

    const payload = { sub: user.id, email: user.email, name: user.name };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        name: user.name,
        plan: user.plan,
      },
    };
  }
}
