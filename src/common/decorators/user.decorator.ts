import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  CtxType,
  IAuthenticationRequest,
  IAuthenticationSocket,
} from '../interfaces';
import { hydratedUserDocument } from 'src/models';
import { GqlExecutionContext } from '@nestjs/graphql';

export const User = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    let user!: hydratedUserDocument;

    switch (context.getType<CtxType>()) {
      case 'http':
        // to access the incoming http request we use:
        user = context.switchToHttp().getRequest<IAuthenticationRequest>()
          .credentials.userAccount;
        break;
      case 'graphql':
        // to access the incoming http request we use:
        user = GqlExecutionContext.create(context).getContext<{
          req: IAuthenticationRequest;
        }>().req.credentials.userAccount;
        break;
      case 'ws':
        user = context.switchToWs().getClient<IAuthenticationSocket>()
          .credentials.userAccount;
        break;
      default:
        break;
    }
    return user;
  },
);
