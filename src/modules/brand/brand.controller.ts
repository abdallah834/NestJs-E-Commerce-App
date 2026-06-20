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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Auth, User } from 'src/common/decorators';
import { RoleEnums } from 'src/common/enums';
import { cloudMulter, fileFieldValidation } from 'src/common/utils/multer';
import type { hydratedUserDocument } from 'src/models';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto, UpdateBrandParamsDto } from './dto/update-brand.dto';
import type { IBrand, IMulterFile } from 'src/common/interfaces';

@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}
  ////////////////////////////////////////////////////////// create brand
  @UseInterceptors(
    FileInterceptor(
      'attachment',
      cloudMulter({ validation: fileFieldValidation.image }),
    ),
  )
  @Auth({ roles: [RoleEnums.ADMIN] })
  @Post('create')
  async create(
    @Body() createBrandDto: CreateBrandDto,
    @User() user: hydratedUserDocument,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png)$/ }),
        ],
      }),
    )
    file: IMulterFile,
  ): Promise<IBrand> {
    return await this.brandService.create(createBrandDto, user, file);
  }
  ////////////////////////////////////////////////////////// update brand
  @UseInterceptors(
    FileInterceptor(
      'attachment',
      cloudMulter({ validation: fileFieldValidation.image }),
    ),
  )
  @Auth({ roles: [RoleEnums.ADMIN] })
  @Patch(':brandId')
  async update(
    @Param() brandId: UpdateBrandParamsDto,
    @Body() updateBrandDto: UpdateBrandDto,
    @User() user: hydratedUserDocument,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png)$/ }),
        ],
      }),
    )
    file?: IMulterFile,
  ) {
    return await this.brandService.update(brandId, updateBrandDto, user, file);
  }

  @Get()
  findAll() {
    return this.brandService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.brandService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.brandService.remove(+id);
  }
}
