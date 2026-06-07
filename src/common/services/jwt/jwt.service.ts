import type { JwtPayload, SignOptions } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { HydratedDocument, Types } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { UserRepo } from 'src/common/repository';
import { CacheService } from '../redis';
import { ConfigService } from '@nestjs/config';
import { AudienceEnum, RoleEnum, TokenType } from 'src/common/enums';
import { hydratedUserDocument } from 'src/models';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

type SignaturesType = {
  accessSignature: string | undefined;
  refreshSignature: string | undefined;
};

export class TokenService {
  constructor(
    private readonly userRepo: UserRepo,
    private readonly redisRepo: CacheService,
    private readonly configService: ConfigService,
  ) {}
  //////////////////////// Core functionality
  sign({
    payload,
    secretOrPrivateKey = this.configService.get<string>(
      'USER_TOKEN_SECRET_KEY',
    ),
    options,
  }: {
    payload: object;
    secretOrPrivateKey?: string | undefined;
    options?: SignOptions;
  }): string {
    return jwt.sign(payload, secretOrPrivateKey as string, options);
  }
  verify({
    token,
    secretOrPrivateKey = this.configService.get<string>(
      'USER_TOKEN_SECRET_KEY',
    ),
  }: {
    token: string;
    secretOrPrivateKey: string | undefined;
  }): JwtPayload {
    return jwt.verify(token, secretOrPrivateKey as string) as JwtPayload;
  }
  ///////////////////// JWT helper functions

  getTokenSignature(role: RoleEnum | string | undefined): {
    signatures: SignaturesType;
    audience: AudienceEnum | string;
  } {
    let signatures: SignaturesType;
    let audience = AudienceEnum.USER;
    switch (role) {
      case RoleEnum.ADMIN:
        signatures = {
          accessSignature: this.configService.get<string>(
            'SYSTEM_TOKEN_SECRET_KEY',
          ),
          refreshSignature: this.configService.get<string>(
            'SYS_REFRESH_TOKEN_SECRET_KEY',
          ),
        };

        audience = AudienceEnum.SYSTEM;
        break;
      default:
        signatures = {
          accessSignature: this.configService.get<string>(
            'USER_TOKEN_SECRET_KEY',
          ),
          refreshSignature: this.configService.get<string>(
            'USER_REFRESH_TOKEN_SECRET_KEY',
          ),
        };
        audience = AudienceEnum.USER;
        break;
    }
    return { signatures, audience };
  }

  getSignatureLevel(
    tokenType = TokenType.ACCESS,
    signatureLevel: RoleEnum | undefined,
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
    const accessToken = this.sign({
      payload: { sub: user._id },
      options: {
        issuer,
        audience: [
          TokenType.ACCESS as unknown as string,
          audience as unknown as string,
        ],
        expiresIn: Number(
          this.configService.get<string>('ACCESS_TOKEN_EXPIRATION_TIME'),
        ),
        jwtid: jtId,
      },
    });
    const refreshToken = this.sign({
      payload: { sub: user._id },
      secretOrPrivateKey: accessAndRefreshSigns.refreshSignature,
      options: {
        issuer,
        audience: [
          TokenType.REFRESH as unknown as string,
          audience as unknown as string,
        ],
        expiresIn: Number(
          this.configService.get<string>('REFRESH_TOKEN_EXPIRATION_TIME'),
        ),
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
    const decodedToken = jwt.decode(token) as JwtPayload;
    if (!decodedToken?.aud?.length || decodedToken?.aud?.length <= 1) {
      throw new BadRequestException('Failed to decode token without audience');
    }

    const [decodedTokenType, audienceType] = decodedToken.aud;

    ///////////////
    const numDecodedTokenType = Number(decodedTokenType);
    const numAudienceType = Number(audienceType);
    if (numDecodedTokenType !== tokenType) {
      throw new BadRequestException('Invalid token type');
    }
    if (
      decodedToken.jti &&
      (await this.redisRepo.redisGet(
        this.redisRepo.redisRevokeTokenKey({
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
    const verifiedData = this.verify({
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
    await this.redisRepo.redisSet({
      key: this.redisRepo.redisRevokeTokenKey({ userId, jti }),
      value: jti,
      ttl,
    });
    return;
  }
}
