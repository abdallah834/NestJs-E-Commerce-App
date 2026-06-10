import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';

import { TokenService } from '../services';
import type { Request, Response, NextFunction } from 'express';
import { TokenType } from '../enums';

export const preAuthMiddleware = (
  req: Request & { tokenType: TokenType },
  res: Response,
  next: NextFunction,
) => {
  // Bearer token
  if (!req.headers.authorization) {
    return res.status(401).json({ message: 'No authorization provided' });
  }

  next();
};
@Injectable()
export class AuthenticationMiddleware implements NestMiddleware {
  constructor(private readonly tokenService: TokenService) {}
  async use(
    req: Request & { tokenType: TokenType },
    res: Response,
    next: NextFunction,
  ) {
    const [key, accessToken] = req.headers.authorization?.split(
      ' ',
    ) as string[];
    if (!accessToken) {
      throw new BadRequestException('Auth token missing');
    } else if (!key) {
      throw new BadRequestException('Auth key missing');
    }

    await this.tokenService.decodeToken({
      token: accessToken,
      tokenType: req.tokenType,
    });

    next();
  }
}
