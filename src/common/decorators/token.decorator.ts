import { SetMetadata } from '@nestjs/common';
import { TokenType } from '../enums';
export const tokenTypeName = 'tokenType';
export const Token = (tokenType: TokenType = TokenType.ACCESS) =>
  SetMetadata(tokenTypeName, tokenType);
