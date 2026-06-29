import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Auth } from 'src/common/decorators';
import { GQLPaginationDto } from 'src/common/dto';
import { RoleEnums } from 'src/common/enums';
import { SayHiInputDto } from './dto/create-product.dto';
import {
  PaginateProductsResponse,
  SayHiResponse,
} from './entities/product.entity';
import { ProductService } from './product.service';
import { IPaginate, IProduct } from 'src/common/interfaces';
import { UseInterceptors } from '@nestjs/common';
import { CustomCacheInterceptor } from 'src/common/interceptors/cache.interceptor';

@Resolver()
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}
  @UseInterceptors(CustomCacheInterceptor)
  @Query(() => PaginateProductsResponse)
  async allProducts(
    @Args({ nullable: false })
    args: GQLPaginationDto,
  ): Promise<IPaginate<IProduct>> {
    const result = await this.productService.findAll(args);
    console.log(result);
    return result;
  }
  @Auth({ roles: [RoleEnums.ADMIN] })
  @Query(() => SayHiResponse, {
    description: 'GQL introduction api',
    nullable: false,
  })
  sayHi(
    @Args() data: SayHiInputDto,
    // @Args('data', { type: () => SayHiInputDto, nullable: false })
    // data: SayHiInputDto,
    // @User() user: hydratedUserDocument,
  ): {
    name: string;
    age?: number;
  } {
    // const products = await this.productService.findAll();
    return { name: data.name, age: data?.age };
  }
  @Mutation(() => SayHiResponse, {
    description: 'GQL introduction api',
    nullable: false,
  })
  lol(): { message: string; age?: number } {
    return { message: 'hello gql', age: 22 };
  }
}
