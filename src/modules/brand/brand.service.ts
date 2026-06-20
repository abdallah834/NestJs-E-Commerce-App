import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { IBrand, IMulterFile } from 'src/common/interfaces';
import { BrandRepo } from 'src/common/repository';
import { S3Service } from 'src/common/services';
import { hydratedUserDocument } from 'src/models';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto, UpdateBrandParamsDto } from './dto/update-brand.dto';
import { mongo } from 'mongoose';
import {
  fileFieldValidation,
  verifyFileSignature,
} from 'src/common/utils/multer';

@Injectable()
export class BrandService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly brandRepo: BrandRepo,
  ) {}
  async create(
    { name }: CreateBrandDto,
    user: hydratedUserDocument,
    file: IMulterFile,
  ): Promise<IBrand> {
    try {
      const checkExistingBrand = await this.brandRepo.findOne({
        filter: { name, paranoid: false },
      });
      if (checkExistingBrand) {
        throw new ConflictException('This brand name already exists');
      }
      ///////using file-type package to validate the type of the uploaded user file to make sure it's not a .exe
      await verifyFileSignature(file, fileFieldValidation.image);
      const image = await this.s3Service.uploadAsset({ file, path: `Brands` });
      const brand = await this.brandRepo.createOne({
        data: { name, image, createdBy: user._id },
      });
      if (!brand) {
        await this.s3Service.deleteAsset({ Key: image });
        throw new InternalServerErrorException('Failed to create brand');
      }
      return brand.toJSON();
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        'S3 bucket credentials are needed to upload brand image',
      );
    }
  }

  findAll() {
    return `This action returns all brand`;
  }

  findOne(id: number) {
    return `This action returns a #${id} brand`;
  }

  async update(
    { brandId }: UpdateBrandParamsDto,
    { name }: UpdateBrandDto,
    user: hydratedUserDocument,
    file?: IMulterFile,
  ): Promise<IBrand> {
    brandId = mongo.ObjectId.createFromHexString(brandId as string);
    const ExistingBrand = await this.brandRepo.findOne({
      filter: { _id: brandId },
    });
    if (!ExistingBrand) {
      throw new NotFoundException('Failed to find a matching brand');
    }
    if (name) {
      if (
        await this.brandRepo.findOne({
          filter: { name, _id: { $ne: brandId }, paranoid: false },
        })
      ) {
        throw new ConflictException(
          'A brand found already existing with this name',
        );
      }
      ExistingBrand.name = name;
      ExistingBrand.slug = ExistingBrand.name.replaceAll(' ', '-');
    }
    const oldImage = ExistingBrand.image;
    if (file) {
      ///////using file-type package to validate the type of the uploaded user file to make sure it's not a .exe
      await verifyFileSignature(file, fileFieldValidation.image);
      try {
        if (oldImage) {
          await this.s3Service.deleteAsset({ Key: oldImage });
        }
        ExistingBrand.image = await this.s3Service.uploadAsset({
          file: file,
          path: 'Brands',
        });
      } catch (error) {
        console.log(error);
        throw new InternalServerErrorException(
          'S3Bucket credentials missing or something went wrong with the service',
        );
      }
    }

    ExistingBrand.updatedBy = user._id;
    await ExistingBrand.save();
    return ExistingBrand.toJSON();
  }

  remove(id: number) {
    return `This action removes a #${id} brand`;
  }
}
