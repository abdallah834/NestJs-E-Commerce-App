import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { BrandModel, CategoryModel } from 'src/models';
import { BrandRepo, CategoryRepo } from 'src/common/repository';
import { S3Service } from 'src/common/services';

@Module({
  imports: [CategoryModel, BrandModel],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepo, BrandRepo, S3Service],
})
export class CategoryModule {}
