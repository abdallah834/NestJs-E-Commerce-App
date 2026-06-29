import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { hydratedUserDocument } from 'src/models';

export interface IAuthenticationRequest extends Request {
  credentials: { userAccount: hydratedUserDocument; decodedToken: JwtPayload };
}

export type CtxType = 'http' | 'ws' | 'rpc' | 'graphql';
