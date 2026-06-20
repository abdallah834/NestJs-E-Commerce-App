import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { tokenTypeName } from 'src/common/decorators';
import { TokenType } from 'src/common/enums';
import { IAuthenticationRequest } from 'src/common/interfaces';
import { TokenService } from 'src/common/services';
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
      let req!: IAuthenticationRequest;
      let authorization!: string;
      switch (context.getType()) {
        case 'http':
          req = context.switchToHttp().getRequest();
          authorization = req.headers.authorization as string;
          break;
        // case 'ws':
        //   req = context.switchToWs().getClient();
        //   authorization = req.headers.authorization as string;
        //   break;
        default:
          break;
      }
      if (!authorization) {
        throw new BadRequestException('No bearer auth provided');
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
      console.log(error);
      throw new BadRequestException('JWT token expired');
    }
  }
}
