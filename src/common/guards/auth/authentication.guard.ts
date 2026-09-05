import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { TokenExpiredError } from 'jsonwebtoken';
import { tokenTypeName } from 'src/common/decorators';
import { TokenType } from 'src/common/enums';
import {
  CtxType,
  IAuthenticationRequest,
  IAuthenticationSocket,
} from 'src/common/interfaces';
import { TokenService } from 'src/common/services';
import { getAuthenticatedSocket } from '../../utils/socketIo';
@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // in order for the reflector to work it needs a specified scope class or handler
      const tokenType =
        this.reflector.getAllAndOverride<TokenType>(tokenTypeName, [
          context.getHandler(),
          context.getClass(),
        ]) ?? TokenType.ACCESS;
      let req!: IAuthenticationRequest | IAuthenticationSocket;
      let authorization!: string;
      switch (context.getType<CtxType>()) {
        case 'http':
          req = context.switchToHttp().getRequest<IAuthenticationRequest>();
          authorization = req.headers.authorization as string;
          break;
        case 'graphql':
          // to get the context for GQL requests
          req = GqlExecutionContext.create(context).getContext<{
            req: IAuthenticationRequest;
          }>().req;
          authorization = req.headers['authorization'] as string;
          break;
        case 'ws':
          req = context.switchToWs().getClient<IAuthenticationSocket>();
          authorization = `Bearer ${getAuthenticatedSocket(req)}`;
          break;
        default:
          break;
      }
      if (!authorization && context.getType<CtxType>() === 'http') {
        throw new BadRequestException('No bearer auth provided');
      } else if (
        (!authorization && context.getType<CtxType>() === 'graphql') ||
        (!authorization && context.getType<CtxType>() === 'ws')
      ) {
        return false;
      }
      const [flag, token] = authorization.split(' ');

      if (!flag || !token) {
        throw new BadRequestException('Missing authorization parts');
      }
      switch (flag) {
        default: {
          // "Bearer"
          req.credentials = await this.tokenService.decodeToken({
            token,
            tokenType,
          });

          break;
        }
      }
      return true;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new BadRequestException('JWT token expired');
      } else if (
        context.getType<CtxType>() === 'graphql' ||
        context.getType<CtxType>() === 'ws'
      ) {
        return false;
      }
      return false;
    }
  }
}
