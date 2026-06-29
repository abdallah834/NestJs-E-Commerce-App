import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Auth, User } from 'src/common/decorators';
import { PersonalCache, RoleEnums } from 'src/common/enums';
import { AuthenticationGuard } from 'src/common/guards';
import { CustomCacheInterceptor } from 'src/common/interceptors/cache.interceptor';
import { ICart } from 'src/common/interfaces';
import type { hydratedUserDocument } from 'src/models';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { RemovedItemsFromCart } from './dto/update-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}
  ///////////////////////////// creating a cart
  @Auth({ roles: [RoleEnums.ADMIN, RoleEnums.USER] })
  @Post('create')
  async create(
    @Body() createCartDto: CreateCartDto,
    @User() user: hydratedUserDocument,
  ): Promise<ICart> {
    return await this.cartService.create(createCartDto, user);
  }

  ///////////////////////////// getting cart
  @UseGuards(AuthenticationGuard)
  // PersonalCache caches the logged in user data by their id
  @PersonalCache(true)
  @UseInterceptors(CustomCacheInterceptor)
  @Get()
  async findOne(@User() user: hydratedUserDocument) {
    return await this.cartService.findOne(user);
  }
  ///////////////////////////// updating cart
  @UseGuards(AuthenticationGuard)
  @Patch()
  update(
    @User() user: hydratedUserDocument,
    @Body() removedProducts: RemovedItemsFromCart,
  ) {
    return this.cartService.update(user, removedProducts);
  }
  @UseGuards(AuthenticationGuard)
  @Delete()
  async remove(@User() user: hydratedUserDocument) {
    return await this.cartService.remove(user);
  }
}
