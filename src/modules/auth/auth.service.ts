import { permission } from 'process';
import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'src/modules/users/user.interface';
import { UsersService } from 'src/modules/users/users.service';
import { IPayload } from './payload.interface';
import { SignUpUserDto } from '../users/dtos/sign-up-user.dto';
import { ConfigService } from '@nestjs/config';
import ms, { StringValue } from 'ms';
import { Response } from 'express';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private rolesService: RolesService,
  ) {}

  /**
   * API
   */

  async signIn(user: IUser, res: Response) {
    const { _id, email, name, role, permissions } = user;

    const payload: IPayload = {
      iss: 'server',
      sub: 'sign-in-access-token',
      _id,
      email,
      name,
      role,
    };

    await this.handleRefreshToken(payload, res);

    return {
      access_token: this.jwtService.sign(payload),
      user: { _id, email, name, role, permissions } as IUser,
    };
  }

  async signUp(signUpUserDto: SignUpUserDto) {
    const newUser = await this.usersService.signUp(signUpUserDto);

    return {
      _id: newUser._id,
      createdAt: newUser.createdAt,
    };
  }

  async refreshToken(refreshToken: string, res: Response) {
    const user = await this.usersService.findUserByToken(refreshToken);

    if (user) {
      const { _id, email, name, role: roleMongoId } = user; // in user document, role is just an id reference to a role object
      const roleObj = await this.rolesService.findOne(roleMongoId.toString()); // real role object
      const role = {
        _id: roleObj._id.toString(),
        name: roleObj.name,
      };

      // sign in again
      const payload: IPayload = {
        iss: 'server',
        sub: 'refresh-access-token',
        _id: _id.toString(),
        email,
        name,
        role,
      };

      await this.handleRefreshToken(payload, res);

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          _id: _id.toString(),
          email,
          name,
          role,
          permissions: roleObj.permissions,
        } as IUser,
      };
    } else {
      throw new BadRequestException(
        'Expired refresh token. Please sign in again',
      );
    }
  }

  async signOut(res: Response, user: IUser) {
    // set user token in db to null
    await this.usersService.updateUserToken(user._id, '');

    // clear cookie
    res.clearCookie('refresh_token');
  }

  /**
   * Helper
   */

  async verifyUser(email: string, password: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (user) {
      const isPasswordMatched = this.usersService.comparePassword(
        password,
        user.password,
      );

      if (isPasswordMatched) {
        const roleMongoId = user.role;
        const roleObj = await this.rolesService.findOne(roleMongoId.toString());

        const userObj: IUser = {
          ...user.toObject(),
          role: {
            _id: roleObj._id.toString(),
            name: roleObj.name,
          },
          permissions: roleObj.permissions,
        };

        return userObj;
      }
    }
    return null;
  }

  async handleRefreshToken(payload: IPayload, res: Response) {
    // create refresh token
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn:
        ms(
          this.configService.getOrThrow<StringValue>(
            'JWT_REFRESH_TOKEN_EXPIRED_TIME',
          ),
        ) / 1000,
    });

    // update user refresh token
    await this.usersService.updateUserToken(payload._id, refreshToken);

    // save refresh token into cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      maxAge: ms(
        this.configService.getOrThrow<StringValue>(
          'JWT_REFRESH_TOKEN_EXPIRED_TIME',
        ),
      ),
    });
  }
}
