import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ICart } from 'src/common/interfaces';
import { CartRepo, ProductRepo } from 'src/common/repository';
import { hydratedUserDocument } from 'src/models';
import { CreateCartDto } from './dto/create-cart.dto';
import { RemovedItemsFromCart } from './dto/update-cart.dto';
import { CacheService } from 'src/common/services';

@Injectable()
export class CartService {
  constructor(
    private readonly productRepo: ProductRepo,
    private readonly cartRepo: CartRepo,
    private readonly redis: CacheService,
  ) {}
  async clearCache(user: hydratedUserDocument) {
    await this.redis.redisDelKeys([
      this.redis.getCacheKey('/cart', user._id.toString()),
    ]);
  }
  async create(
    { productId, quantity }: CreateCartDto,
    user: hydratedUserDocument,
  ): Promise<ICart> {
    productId = productId
      ? Types.ObjectId.createFromHexString(productId as string)
      : productId;
    const matchingProduct = await this.productRepo.findOne({
      filter: { _id: productId, stock: { $gte: quantity } },
    });
    if (!matchingProduct) {
      throw new NotFoundException('This product is out stock');
    }
    let userCart = await this.cartRepo.findOne({
      filter: { createdBy: user._id },
    });
    if (!userCart) {
      userCart = await this.cartRepo.createOne({
        data: {
          createdBy: user._id,
          products: [{ productId, quantity: quantity > 0 ? quantity : 1 }],
        },
      });
      await this.clearCache(user);
      return userCart.toJSON();
    }
    let matchingCart: boolean = false;

    userCart.products.map((product) => {
      if (
        (product.productId as Types.ObjectId).toString() ===
        productId.toString()
      ) {
        matchingCart = true;
        product.quantity += quantity;
        product.quantity = product.quantity > 0 ? product.quantity : 1;
        if (matchingProduct.stock < product.quantity) {
          throw new BadRequestException(
            "product's stock is less than the ordered quantity",
          );
        }
      }
    });
    if (!matchingCart) {
      userCart.products.push({
        productId,
        quantity: quantity > 0 ? quantity : 1,
      });
    }
    await userCart.save();
    await this.clearCache(user);
    return userCart.toJSON();
  }

  findAll() {
    return `This action returns all cart`;
  }

  async findOne(user: hydratedUserDocument): Promise<ICart> {
    const cart = await this.cartRepo.findOne({
      filter: { createdBy: user._id },
      options: { populate: [{ path: 'products.productId' }] },
    });
    if (!cart) {
      throw new NotFoundException('Cart is empty');
    }
    return cart.toJSON();
  }

  async update(
    user: hydratedUserDocument,
    { productIds }: RemovedItemsFromCart,
  ): Promise<ICart> {
    (productIds as string[]).map((product) => {
      Types.ObjectId.createFromHexString(product);
    });
    const userCart = await this.cartRepo.findOneAndUpdate({
      filter: { createdBy: user._id },
      update: { $pull: { products: { productId: { $in: productIds } } } },
    });
    if (!userCart) {
      throw new NotFoundException("Couldn't find user's cart ");
    }
    await this.clearCache(user);

    return userCart.toJSON();
  }

  async remove(user: hydratedUserDocument): Promise<ICart> {
    const userCart = await this.cartRepo.findOneAndDelete({
      filter: { createdBy: user._id },
    });
    if (!userCart) {
      throw new NotFoundException("Couldn't find user's cart ");
    }
    await this.clearCache(user);

    return userCart.toJSON();
  }
}
