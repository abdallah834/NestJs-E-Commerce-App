import { applyDecorators, UseGuards } from '@nestjs/common';
import { Token } from './token.decorator';
import { Role } from './role.decorator';
import { AuthenticationGuard } from '../guards/authentication.guard';
import { AuthorizationGuard } from '../guards/authorization.guard';
import { RoleEnums, TokenType } from '../enums';

export const Auth = ({
  roles,
  tokenType,
}: {
  roles: RoleEnums[];
  tokenType?: TokenType;
}) => {
  return applyDecorators(
    Token(tokenType),
    Role(roles),
    UseGuards(AuthenticationGuard, AuthorizationGuard),
  );
};
