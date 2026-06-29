import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Auth, User } from 'src/common/decorators';
import { RoleEnums } from 'src/common/enums';
import { IMulterFile, IPaginate, IProduct } from 'src/common/interfaces';
import { cloudMulter, fileFieldValidation } from 'src/common/utils/multer';
import type { hydratedUserDocument } from 'src/models';
import { CreateProductDto } from './dto/create-product.dto';
import {
  UpdateProductDto,
  UpdateProductParamsDto,
} from './dto/update-product.dto';
import { ProductService } from './product.service';
import { PaginationDto } from 'src/common/dto';
import { CustomCacheInterceptor } from 'src/common/interceptors/cache.interceptor';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}
  ///////////////////////////////// Creating a product
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'gallery', maxCount: 3 },
      ],
      cloudMulter({ validation: fileFieldValidation.image }),
    ),
  )
  @Auth({ roles: [RoleEnums.ADMIN] })
  @Post('create')
  create(
    @Body() createProductDto: CreateProductDto,
    @User() user: hydratedUserDocument,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png)$/ }),
        ],
      }),
    )
    files: { image: IMulterFile[]; gallery?: IMulterFile[] },
  ) {
    return this.productService.create(createProductDto, user, files);
  }

  ///////////////////////////////// Updating a product

  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'gallery', maxCount: 3 },
      ],
      cloudMulter({ validation: fileFieldValidation.image }),
    ),
  )
  @Auth({ roles: [RoleEnums.ADMIN] })
  @Patch(':productId')
  async update(
    @Param() params: UpdateProductParamsDto,
    @Body() updateProductBody: UpdateProductDto,
    @User() user: hydratedUserDocument,
    @UploadedFiles(
      // in order for validation to work memory storage has to be used if not it will fail silently
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png)$/ }),
        ],
      }),
    )
    files?: { image?: IMulterFile[]; gallery?: IMulterFile[] },
  ) {
    return await this.productService.update(
      params,
      updateProductBody,
      user,
      files,
    );
  }
  ///////////////////////////////// Getting all products

  @UseInterceptors(CustomCacheInterceptor)
  @Get()
  async findAll(@Query() query: PaginationDto): Promise<IPaginate<IProduct>> {
    return await this.productService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(+id);
  }
}
