import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { hydratedUserDocument } from 'src/models';

export interface IAuthenticationRequest extends Request {
  credentials: { userAccount: hydratedUserDocument; decodedToken: JwtPayload };
}
export interface IAuthenticationSocket extends Socket {
  credentials: { userAccount: hydratedUserDocument; decodedToken: JwtPayload };
}

export type CtxType = 'http' | 'ws' | 'rpc' | 'graphql';
