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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import {
  UpdateCategoryDto,
  UpdateCategoryParamsDto,
} from './dto/update-category.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { cloudMulter, fileFieldValidation } from 'src/common/utils/multer';
import { RoleEnums } from 'src/common/enums';
import { Auth, User } from 'src/common/decorators';
import type { hydratedUserDocument } from 'src/models';
import type { ICategory, IMulterFile } from 'src/common/interfaces';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  ////////////////////////////////////////////////////////// create category
  @UseInterceptors(
    FileInterceptor(
      'attachment',
      cloudMulter({ validation: fileFieldValidation.image }),
    ),
  )
  @Auth({ roles: [RoleEnums.ADMIN] })
  @Post('create')
  async create(
    @Body() createBrandDto: CreateCategoryDto,
    @User() user: hydratedUserDocument,
    @UploadedFile(
      new ParseFilePipe({
        // in order for validation to work memory storage has to be used if not it will fail silently
        validators: [
          new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png)$/ }),
        ],
      }),
    )
    file: IMulterFile,
  ): Promise<ICategory> {
    return await this.categoryService.create(createBrandDto, user, file);
  }
  ////////////////////////////////////////////////////////// update category
  @UseInterceptors(
    FileInterceptor(
      'attachment',
      cloudMulter({ validation: fileFieldValidation.image }),
    ),
  )
  @Auth({ roles: [RoleEnums.ADMIN] })
  @Patch(':categoryId')
  async update(
    @Param() categoryId: UpdateCategoryParamsDto,
    @Body() updateCategoryBody: UpdateCategoryDto,
    @User() user: hydratedUserDocument,
    @UploadedFile(
      // in order for validation to work memory storage has to be used if not it will fail silently
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png)$/ }),
        ],
      }),
    )
    file?: IMulterFile,
  ) {
    return await this.categoryService.update(
      categoryId,
      updateCategoryBody,
      user,
      file,
    );
  }

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoryService.remove(+id);
  }
}
