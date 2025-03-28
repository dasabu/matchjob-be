import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { IUser } from 'src/modules/users/user.interface';
import { IPayload } from '../payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_TOKEN_SECRET'),
    });
  }

  async validate(payload: IPayload) {
    // decoded payload from token
    const user: IUser = {
      _id: payload._id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
    return user; // req.user = payload
  }
}
