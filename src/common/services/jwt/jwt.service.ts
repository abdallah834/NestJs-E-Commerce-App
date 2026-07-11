import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload, SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { AudienceEnum, RoleEnums, TokenType } from 'src/common/enums';
import { UserRepo } from 'src/common/repository';
import { hydratedUserDocument } from 'src/models';
import { CacheService } from '../redis';

type SignaturesType = {
  accessSignature: string | undefined;
  refreshSignature: string | undefined;
};
@Injectable()
export class TokenService {
  private USER_TOKEN_SECRET_KEY: string;
  private SYSTEM_TOKEN_SECRET_KEY: string;
  private SYS_REFRESH_TOKEN_SECRET_KEY: string;
  private USER_REFRESH_TOKEN_SECRET_KEY: string;
  private ACCESS_TOKEN_EXPIRATION_TIME: number;
  private REFRESH_TOKEN_EXPIRATION_TIME: number;
  constructor(
    private readonly JWTService: JwtService,
    private readonly userRepo: UserRepo,
    private readonly redisService: CacheService,
    private readonly configService: ConfigService,
  ) {
    this.USER_TOKEN_SECRET_KEY = this.configService.get(
      'USER_TOKEN_SECRET_KEY',
    ) as string;
    this.SYSTEM_TOKEN_SECRET_KEY = this.configService.get(
      'SYSTEM_TOKEN_SECRET_KEY',
    ) as string;
    this.SYS_REFRESH_TOKEN_SECRET_KEY = this.configService.get(
      'SYS_REFRESH_TOKEN_SECRET_KEY',
    ) as string;
    this.USER_REFRESH_TOKEN_SECRET_KEY = this.configService.get(
      'USER_REFRESH_TOKEN_SECRET_KEY',
    ) as string;
    this.ACCESS_TOKEN_EXPIRATION_TIME = this.configService.get(
      'ACCESS_TOKEN_EXPIRATION_TIME',
    ) as number;
    this.REFRESH_TOKEN_EXPIRATION_TIME = this.configService.get(
      'REFRESH_TOKEN_EXPIRATION_TIME',
    ) as number;
  }
  //////////////////////// Core functionality
  async sign({
    payload,
    secretOrPrivateKey = this.USER_TOKEN_SECRET_KEY,

    options,
  }: {
    payload: object;
    secretOrPrivateKey?: string | undefined;
    options?: SignOptions;
  }): Promise<string> {
    return await this.JWTService.signAsync(payload, {
      secret: secretOrPrivateKey,
      ...options,
    });
  }

  async verify({
    token,
    secretOrPrivateKey = this.USER_TOKEN_SECRET_KEY,
  }: {
    token: string;
    secretOrPrivateKey: string | undefined;
  }): Promise<JwtPayload> {
    return await this.JWTService.verifyAsync(token, {
      secret: secretOrPrivateKey,
    });
  }
  ///////////////////// JWT helper functions

  getTokenSignature(role: RoleEnums | string | undefined): {
    signatures: SignaturesType;
    audience: AudienceEnum | string;
  } {
    let signatures: SignaturesType;
    let audience = AudienceEnum.USER;
    switch (role) {
      case RoleEnums.ADMIN:
        signatures = {
          accessSignature: this.SYSTEM_TOKEN_SECRET_KEY,

          refreshSignature: this.SYS_REFRESH_TOKEN_SECRET_KEY,
        };
        audience = AudienceEnum.SYSTEM;
        break;
      default:
        signatures = {
          accessSignature: this.USER_TOKEN_SECRET_KEY,
          refreshSignature: this.USER_REFRESH_TOKEN_SECRET_KEY,
        };
        audience = AudienceEnum.USER;
        break;
    }
    return { signatures, audience };
  }

  getSignatureLevel(
    tokenType = TokenType.ACCESS,
    signatureLevel: RoleEnums | undefined,
  ): string | undefined {
    const signatures = this.getTokenSignature(signatureLevel).signatures;
    let result: string | undefined;
    switch (tokenType) {
      case TokenType.REFRESH:
        result = signatures.refreshSignature;
        break;
      default:
        result = signatures.accessSignature;
        break;
    }
    return result;
  }

  async createLoginTokens(
    user: hydratedUserDocument,
    issuer: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // const { accessSignature, refreshSignature, audience } = (
    //   await this.getTokenSignature(user.role)
    // ).signatures;

    const [accessAndRefreshSigns, audience] = [
      this.getTokenSignature(user.role).signatures,
      this.getTokenSignature(user.role).audience,
    ];
    const jtId = randomUUID();
    const accessToken = await this.sign({
      payload: { sub: user._id },
      options: {
        issuer,
        audience: [
          TokenType.ACCESS as unknown as string,
          audience as unknown as string,
        ],
        expiresIn: Number(this.ACCESS_TOKEN_EXPIRATION_TIME),
        jwtid: jtId,
      },
    });
    const refreshToken = await this.sign({
      payload: { sub: user._id },
      secretOrPrivateKey: accessAndRefreshSigns.refreshSignature,
      options: {
        issuer,
        audience: [
          TokenType.REFRESH as unknown as string,
          audience as unknown as string,
        ],
        expiresIn: Number(this.REFRESH_TOKEN_EXPIRATION_TIME),
        jwtid: jtId,
      },
    });
    return { accessToken, refreshToken };
  }

  async decodeToken({
    token,
    tokenType = TokenType.ACCESS,
  }: {
    token: string;
    tokenType?: TokenType | undefined;
  }): Promise<{
    userAccount: hydratedUserDocument;
    decodedToken: JwtPayload;
  }> {
    try {
      await this.JWTService.verifyAsync(token, {
        secret: this.USER_TOKEN_SECRET_KEY,
      });
    } catch (error) {
      throw new BadRequestException(`${error}`);
    }

    const decodedToken = this.JWTService.decode<JwtPayload>(token);

    if (!decodedToken?.aud?.length || decodedToken?.aud?.length <= 1) {
      throw new BadRequestException('Failed to decode token without audience');
    }

    const [decodedTokenType, audienceType] = decodedToken.aud;

    ///////////////
    const numDecodedTokenType: TokenType = Number(decodedTokenType);
    const numAudienceType = Number(audienceType);
    if (tokenType && numDecodedTokenType !== tokenType) {
      throw new BadRequestException('Invalid token type');
    }
    if (
      decodedToken.jti &&
      (await this.redisService.redisGet(
        this.redisService.redisRevokeTokenKey({
          userId: decodedToken.sub,
          jti: decodedToken.jti,
        }),
      ))
    ) {
      throw new UnauthorizedException('Invalid login token');
    }

    const signatureLevel = this.getSignatureLevel(
      numDecodedTokenType,
      numAudienceType,
    );
    const { accessSignature, refreshSignature } =
      this.getTokenSignature(signatureLevel).signatures;
    // console.log({ accessSignature, refreshSignature });
    const verifiedData = await this.verify({
      token,
      secretOrPrivateKey:
        tokenType === TokenType.REFRESH ? refreshSignature : accessSignature,
    });
    const userAccount = await this.userRepo.findOne({
      filter: { _id: verifiedData.sub },
    });
    if (!userAccount) {
      throw new UnauthorizedException('Not registered account');
    }

    if (
      userAccount.changedCredentialsTime &&
      userAccount.changedCredentialsTime?.getTime() >=
        ((decodedToken.iat as number) || 0) * 1000
    ) {
      throw new UnauthorizedException('Invalid login session');
    }

    return { userAccount, decodedToken };
  }
  async createRevokeToken({
    userId,
    jti,
    ttl,
  }: {
    userId: string | Types.ObjectId | undefined;
    jti: string | undefined;
    ttl: number | undefined;
  }) {
    await this.redisService.redisSet({
      key: this.redisService.redisRevokeTokenKey({ userId, jti }),
      value: jti,
      ttl,
    });
    return;
  }
}
