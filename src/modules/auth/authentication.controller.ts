import {
  Body,
  Controller,
  Patch,
  Post,
  Req,
  Res,
  ValidationPipe,
} from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import {
  ConfirmEmail,
  LoginBodyDTO,
  ResendConfirmationEmail,
  SignupBodyDTO,
  SignupWithGmailDTO,
} from './dto/authentication.dto';
import type { Request, Response } from 'express';
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
  ) {
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

    const user = await this.authenticationService.signup(body);
    return { Message: 'Done', user };
  }
  // to change the status code of a response we use
  // @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Req()
    req: Request,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: LoginBodyDTO,
  ) {
    const loginTokens = await this.authenticationService.login(
      body,
      `${req.protocol}://${req.host}`,
    );
    return {
      message: 'Login success',
      loginTokens,
    };
  }

  @Patch('confirmEmail')
  async confirmEmail(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: ConfirmEmail,
  ) {
    await this.authenticationService.confirmEmail(body);
    return {
      message: 'Account confirmation completed',
      status: 201,
    };
  }

  @Patch('resendConfirmationEmail')
  async resendConfirmationEmail(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: ResendConfirmationEmail,
  ) {
    {
      await this.authenticationService.resendConfirmationEmail(body);
      return {
        message: 'OTP resent successfully',
        status: 200,
      };
    }
  }

  @Post('/signup/gmail')
  async gmailSignup(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: SignupWithGmailDTO,
  ) {
    const { status, loginTokens } =
      await this.authenticationService.signupWithGmail(
        body.idToken,
        `${req.protocol}://${req.host}`,
      );
    res.status(status);
    return {
      message: 'signup success using gmail',
      data: loginTokens,
    };
  }
  @Post('/login/gmail')
  async gmailLogin(@Req() req: Request, @Body() body: SignupWithGmailDTO) {
    const account = await this.authenticationService.loginWithGmail(
      body.idToken,
      `${req.protocol}://${req.host}`,
    );
    return {
      message: 'Logged in successfully using gmail',
      data: account,
      status: 200,
    };
  }
}
