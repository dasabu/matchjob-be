import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'src/modules/users/user.interface';
import { UsersService } from 'src/modules/users/users.service';
import { IPayload } from './payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  signIn(user: IUser) {
    const { _id, email, name, role } = user;
    const payload: IPayload = {
      iss: 'server',
      sub: 'sign-in-access-token',
      _id,
      email,
      name,
      role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      _id,
      email,
      name,
      role,
    };
  }

  async verifyUser(email: string, password: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (user) {
      const isPasswordMatched = this.usersService.comparePassword(
        password,
        user.password,
      );
      if (isPasswordMatched) return user;
    }
    return null;
  }
}
