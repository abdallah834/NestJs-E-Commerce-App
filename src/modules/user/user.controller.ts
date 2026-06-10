import { Controller, Get } from '@nestjs/common';
import { Auth, User } from 'src/common/decorators';
import { RoleEnums } from 'src/common/enums';
import type { hydratedUserDocument } from 'src/models';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  //to handle the endpoints that use access tokens or refresh tokens we use SetMetadata along with the guard
  // @Token()
  // // handling user profile form the AuthenticationGuard and request
  // @Role([RoleEnums.ADMIN])
  // @UseGuards(AuthenticationGuard, AuthorizationGuard)
  @Auth({ roles: [RoleEnums.USER] })
  @Get('profile')
  profile(@User() user: hydratedUserDocument) {
    // const user = await this.userService.profile(body);
    return { message: 'Done', profile: user };
  }
}
