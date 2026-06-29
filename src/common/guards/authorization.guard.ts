import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { roleName } from 'src/common/decorators';
import { RoleEnums } from 'src/common/enums';
import { CtxType, IAuthenticationRequest } from 'src/common/interfaces';
import { hydratedUserDocument } from 'src/models';
@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    // in order for the reflector to work it needs a specified scope class or handler
    const roles =
      this.reflector.getAllAndOverride<RoleEnums[]>(roleName, [
        context.getHandler(),
        context.getClass(),
      ]) ?? RoleEnums.USER;
    let user!: hydratedUserDocument;

    switch (context.getType<CtxType>()) {
      case 'http':
        user = context.switchToHttp().getRequest<IAuthenticationRequest>()
          .credentials.userAccount;
        break;
      case 'graphql':
        user = GqlExecutionContext.create(context).getContext<{
          req: IAuthenticationRequest;
        }>().req.credentials.userAccount;
        break;

      default:
        break;
    }
    if (!roles.includes(user.role)) {
      throw new UnauthorizedException("You don't have access to this resource");
    }
    return true;
  }
}
