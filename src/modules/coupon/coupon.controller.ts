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
import type { ICoupon, IMulterFile } from 'src/common/interfaces';
import { cloudMulter, fileFieldValidation } from 'src/common/utils/multer';
import type { hydratedUserDocument } from 'src/models';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';

@Controller('coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}
  @Auth({ roles: [RoleEnums.ADMIN] })
  @UseInterceptors(
    FileInterceptor(
      'attachment',
      cloudMulter({ validation: fileFieldValidation.image }),
    ),
  )
  @Post()
  async create(
    @Body() createCouponDto: CreateCouponDto,
    @User() user: hydratedUserDocument,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    file: IMulterFile,
  ): Promise<ICoupon> {
    return await this.couponService.create(createCouponDto, user, file);
  }

  @Get()
  findAll() {
    return this.couponService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.couponService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    // @Body() updateCouponDto: UpdateCouponDto
  ) {
    return this.couponService.update(
      +id,
      //  updateCouponDto
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.couponService.remove(+id);
  }
}
