import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { BrandModel, CategoryModel, ProductModel } from 'src/models';
import { BrandRepo, CategoryRepo, ProductRepo } from 'src/common/repository';
import { S3Service } from 'src/common/services';
import { ProductResolver } from './product.resolver';

@Module({
  imports: [ProductModel, CategoryModel, BrandModel],
  controllers: [ProductController],
  providers: [
    ProductService,
    CategoryRepo,
    BrandRepo,
    ProductRepo,
    S3Service,
    ProductResolver,
  ],
})
export class ProductModule {}
