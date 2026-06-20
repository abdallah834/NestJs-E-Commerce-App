import { Module } from '@nestjs/common';
import { BrandRepo } from 'src/common/repository';
import { S3Service } from 'src/common/services';
import { SharedAuthenticationModule } from 'src/common/sharedModules';
import { BrandModel } from 'src/models';
import { BrandController } from './brand.controller';
import { BrandService } from './brand.service';

@Module({
  imports: [BrandModel, SharedAuthenticationModule],
  controllers: [BrandController],
  providers: [BrandService, BrandRepo, S3Service],
})
export class BrandModule {}
