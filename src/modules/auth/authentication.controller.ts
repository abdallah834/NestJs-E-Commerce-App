import {
  Body,
  Controller,
  Patch,
  Post,
  Req,
  Res,
  ValidationPipe,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthenticationService } from './authentication.service';
import {
  ConfirmEmail,
  LoginBodyDTO,
  ResendConfirmationEmail,
  SignupBodyDTO,
  SignupWithGmailDTO,
} from './dto/authentication.dto';
import { IUser } from 'src/common/interfaces';
import { LoginResponse } from './entities/authentication.entity';
// to use any controllers we add the controller to the app.module.ts file
// assigning an string argument to the controller basically acts as previous path (auth/signup | auth/login)
// instead of using a certain pipe on individual endpoints we can use on the entire controller or globally on the app
// @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}
  // paths are specified inside the request decorators GET|POST|PATCH etc..
  //to redirect once a user tries to access the path auth to Login we use:(must always be a get request)
  // @Redirect('auth/login')
  // to specify an optional parameter such as Id we contain inside curly brackets {/:id}
  // to use pipes on multiple arguments we use (UsePipes)
  // @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @Post('signup')
  // endpoint decorators
  // {
  // signup(@Req() req: Request)
  // signup(@Body() body: any, @Query() query: any, @Param() params: any)
  // @Res({ passthrough: true }) res: Response
  // }
  // using built in pipes in nest @Body('age', ParseIntPipe|ParseFloatPipe|ParseIntBoolean) to make sure the value sent is valid num,str,bool
  // built in pipes are generally used to validate inputs
  async signUp(
    // class validator pkg is usually a good option to validate inputs while also creating a DTO at the same time
    // { whitelist: true } option doesn't allow any invalidated inputs sent.
    // @Param()
    // params: { flag: boolean },
    @Body()
    body: SignupBodyDTO,
  ): Promise<IUser> {
    // implementing custom validation
    // new CustomValidationPipe<SignupDTO>(signup),
    // new DefaultValuePipe(true),
    // new ParseIntPipe({
    //   exceptionFactory(error) {
    //     // throw new HttpException();
    //     throw new BadRequestException({
    //       message: error,
    //       cause: { extra: 'lol' },
    //     });
    //   },
    //   optional: true,
    // }),
    // console.log(req.body, req.query, req.params);
    // console.log({ body, query, params });
    // res.status(500);

    return await this.authenticationService.signup(body);
  }
  // to change the status code of a response we use
  // @HttpCode(HttpStatus.OK)
  // WatchInterceptor is used to measure the raw performance of the api call (code only) & can be used app level
  // @UseInterceptors(WatchInterceptor)
  @Post('login')
  async login(
    @Req()
    req: Request,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: LoginBodyDTO,
  ): Promise<LoginResponse> {
    return await this.authenticationService.login(
      body,
      `${req.protocol}://${req.host}`,
    );
  }

  @Patch('confirmEmail')
  async confirmEmail(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: ConfirmEmail,
  ): Promise<{
    status: number;
  }> {
    await this.authenticationService.confirmEmail(body);
    return {
      status: 201,
    };
  }

  @Patch('resendConfirmationEmail')
  async resendConfirmationEmail(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: ResendConfirmationEmail,
  ): Promise<{
    status: number;
  }> {
    {
      await this.authenticationService.resendConfirmationEmail(body);
      return {
        status: 200,
      };
    }
  }

  @Post('/signup/gmail')
  async gmailSignup(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: SignupWithGmailDTO,
  ): Promise<{
    message: 'signup success using gmail';
    loginTokens: LoginResponse;
  }> {
    const { status, loginTokens } =
      await this.authenticationService.signupWithGmail(
        body.idToken,
        `${req.protocol}://${req.host}`,
      );
    res.status(status);
    return {
      message: 'signup success using gmail',
      loginTokens,
    };
  }
  @Post('/login/gmail')
  async gmailLogin(
    @Req() req: Request,
    @Body() body: SignupWithGmailDTO,
  ): Promise<{
    account: LoginResponse;
    status: number;
  }> {
    return {
      account: await this.authenticationService.loginWithGmail(
        body.idToken,
        `${req.protocol}://${req.host}`,
      ),
      status: 200,
    };
  }
}
