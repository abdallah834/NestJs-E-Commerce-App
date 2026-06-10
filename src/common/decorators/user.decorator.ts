import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IAuthenticationRequest } from '../interfaces';
import { hydratedUserDocument } from 'src/models';

export const User = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    let user!: hydratedUserDocument;

    switch (context.getType()) {
      case 'http':
        // to access the incoming http request we use:
        user = context.switchToHttp().getRequest<IAuthenticationRequest>()
          .credentials.userAccount;
        break;
      default:
        break;
    }
    return user;
  },
);
