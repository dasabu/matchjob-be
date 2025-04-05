import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { IUser } from 'src/modules/users/user.interface';
import { IPayload } from '../payload.interface';
import { RolesService } from 'src/modules/roles/roles.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private rolesService: RolesService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_TOKEN_SECRET'),
    });
  }

  async validate(payload: IPayload) {
    // decoded payload from token
    const { _id, email, name, role } = payload;

    const roleObj = await this.rolesService.findOne(role._id);

    const user: IUser = {
      _id,
      email,
      name,
      role,
      permissions: roleObj.permissions,
    };

    return user; // req.user = payload
  }
}
