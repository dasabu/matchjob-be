import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from 'src/shared/decorators/public.decorator';
import { SignUpUserDto } from '../users/dtos/sign-up-user.dto';
import { UsersService } from '../users/users.service';
import { Request, Response } from 'express';
import { User } from 'src/shared/decorators/user.decorator';
import { IUser } from '../users/user.interface';
import { RolesService } from '../roles/roles.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly rolesService: RolesService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('sign-in')
  signIn(@User() user: IUser, @Res({ passthrough: true }) res: Response) {
    return this.authService.signIn(user, res);
  }

  @Public()
  @Post('sign-up')
  signUp(@Body() signUpUserDto: SignUpUserDto) {
    return this.authService.signUp(signUpUserDto);
  }

  @Get('account')
  async getAccount(@User() user: IUser) {
    const role = await this.rolesService.findOne(user.role._id);
    user.permissions = role.permissions;
    return {
      user,
    };
  }

  @Public()
  @Get('refresh-token')
  refreshToken(@Req() req, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    return this.authService.refreshToken(refreshToken, res);
  }

  @Post('sign-out')
  signOut(@Res({ passthrough: true }) res: Response, @User() user: IUser) {
    return this.authService.signOut(res, user);
  }
}
