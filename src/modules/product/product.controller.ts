import { ProductService } from './product.service';
import { Controller, Get } from '@nestjs/common';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}
  @Get('list')
  listAllProducts() {
    const products = this.productService.listProducts();

    return { message: 'Success', products };
  }
}
