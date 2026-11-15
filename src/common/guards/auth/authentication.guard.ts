import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { WsException } from '@nestjs/websockets';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
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
    const contextType = context.getType<CtxType>();

    try {
      const tokenType =
        this.reflector.getAllAndOverride<TokenType>(tokenTypeName, [
          context.getHandler(),
          context.getClass(),
        ]) ?? TokenType.ACCESS;

      const { req, authorization } = this.getRequestAndAuthorization(context);
      const token = this.extractBearerToken(authorization);

      req.credentials = await this.tokenService.decodeToken({
        token,
        tokenType,
      });

      return true;
    } catch (error) {
      throw this.toContextException(error, contextType);
    }
  }

  private getRequestAndAuthorization(context: ExecutionContext): {
    req: IAuthenticationRequest | IAuthenticationSocket;
    authorization?: string;
  } {
    switch (context.getType<CtxType>()) {
      case 'http': {
        const req = context.switchToHttp().getRequest<IAuthenticationRequest>();
        return { req, authorization: req.headers.authorization };
      }
      case 'graphql': {
        const { req } = GqlExecutionContext.create(context).getContext<{
          req: IAuthenticationRequest;
        }>();
        return { req, authorization: req.headers.authorization };
      }
      case 'ws': {
        const client = context.switchToWs().getClient<IAuthenticationSocket>();
        const token = getAuthenticatedSocket(client);
        return {
          req: client,
          authorization: token ? `Bearer ${token}` : undefined,
        };
      }
      default:
        throw new UnauthorizedException('Unsupported context type');
    }
  }

  private extractBearerToken(authorization?: string): string {
    if (!authorization) {
      throw new UnauthorizedException('No authorization provided');
    }
    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException(
        'Authorization must be in the format "Bearer <token>"',
      );
    }
    return token;
  }

  private toContextException(error: unknown, contextType: CtxType): Error {
    let exception: Error;

    if (error instanceof HttpException) {
      exception = error;
    } else if (error instanceof TokenExpiredError) {
      exception = new UnauthorizedException('JWT token expired');
    } else if (error instanceof JsonWebTokenError) {
      exception = new UnauthorizedException('Invalid JWT token');
    } else {
      // handling unexpected failure: DB down/bug
      return error as Error;
    }

    return contextType === 'ws'
      ? new WsException(exception.message)
      : exception;
  }
}
