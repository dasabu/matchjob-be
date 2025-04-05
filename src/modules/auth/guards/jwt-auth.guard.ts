import { permission } from 'process';
import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from 'src/shared/decorators/public.decorator';
import { Request } from 'express';
import { Permission } from 'src/modules/permissions/schemas/permission.schema';
import { SKIP_CHECKING_PERMISSION } from 'src/shared/decorators/skip-checking-permission.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // add your custom authentication logic here
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest() as Request;

    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid token');
    }

    // Condition 1: skip checking permission
    const skipCheckingPermission = this.reflector.getAllAndOverride<boolean>(
      SKIP_CHECKING_PERMISSION,
      [context.getHandler(), context.getClass()],
    );

    // get current method (GET, POST) and endpoint
    const targetMethod = request.method;
    const targetEndpoint = request.route?.path as string;

    // Condition 2: auth endpoints
    const isAuthEndpoint: boolean = targetEndpoint.startsWith('/api/v1/auth')
      ? true
      : false;

    // Condition 3: check if user has permission
    const userPermissions: Permission[] = user?.permissions ?? [];
    const hasPermission = userPermissions.find(
      (permission) =>
        targetMethod === permission.method &&
        targetEndpoint === permission.apiPath,
    );

    if (!skipCheckingPermission && !isAuthEndpoint && !hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to access this endpoint',
      );
    }

    return user;
  }
}
