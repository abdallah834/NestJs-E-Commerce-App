import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { mongo } from 'mongoose';
import { ICategory, IMulterFile } from 'src/common/interfaces';
import { BrandRepo, CategoryRepo } from 'src/common/repository';
import { S3Service } from 'src/common/services';
import {
  fileFieldValidation,
  verifyFileSignature,
} from 'src/common/utils/multer';
import { hydratedUserDocument } from 'src/models';
import { CreateCategoryDto } from './dto/create-category.dto';
import {
  UpdateCategoryDto,
  UpdateCategoryParamsDto,
} from './dto/update-category.dto';
import { slugify } from 'node_modules/zod/v4/core/util.cjs';

@Injectable()
export class CategoryService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly brandRepo: BrandRepo,
    private readonly categoryRepo: CategoryRepo,
  ) {}
  async create(
    { name, brandIds = [] }: CreateCategoryDto,
    user: hydratedUserDocument,
    file: IMulterFile,
  ): Promise<ICategory> {
    try {
      brandIds = brandIds.map((brandId) =>
        mongo.ObjectId.createFromHexString(brandId as string),
      );
      const checkExistingCategory = await this.categoryRepo.findOne({
        filter: { name, paranoid: false },
      });
      if (checkExistingCategory) {
        throw new ConflictException('This category already exists');
      }
      if (
        brandIds?.length !==
        (await this.brandRepo.find({ filter: { _id: { $in: brandIds } } }))
          .length
      ) {
        throw new NotFoundException('Some brands were not found');
      }
      ///////using file-type package to validate the type of the uploaded user file to make sure it's not a .exe
      await verifyFileSignature(file, fileFieldValidation.image);
      const image = await this.s3Service.uploadAsset({
        file,
        path: `Categories`,
      });
      const createdCategory = await this.categoryRepo.createOne({
        data: { name, image, brandIds, createdBy: user._id },
      });
      if (!createdCategory) {
        await this.s3Service.deleteAsset({ Key: image });
        throw new InternalServerErrorException('Failed to create category');
      }
      return createdCategory.toJSON();
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        'S3 bucket credentials are needed to upload or delete category brand image',
      );
    }
  }

  findAll() {
    return `This action returns all category`;
  }

  findOne(id: number) {
    return `This action returns a #${id} category`;
  }

  async update(
    { categoryId }: UpdateCategoryParamsDto,
    { name, removeBrandIds = [], brandIds = [] }: UpdateCategoryDto,
    user: hydratedUserDocument,
    file?: IMulterFile,
  ): Promise<ICategory> {
    // Convert all IDs up front
    const categoryObjectId = mongo.ObjectId.createFromHexString(
      categoryId as string,
    );

    const brandObjectIds = (brandIds as string[]).map((id) =>
      mongo.ObjectId.createFromHexString(id),
    );
    const removeBrandObjectIds = (removeBrandIds as string[]).map((id) =>
      mongo.ObjectId.createFromHexString(id),
    );

    const ExistingCategory = await this.categoryRepo.findOne({
      filter: { _id: categoryObjectId },
    });
    if (!ExistingCategory) {
      throw new NotFoundException('Failed to find a matching category');
    }

    if (name) {
      if (
        await this.categoryRepo.findOne({
          filter: { name, _id: { $ne: categoryObjectId }, paranoid: false },
        })
      ) {
        throw new ConflictException('A category already exists with this name');
      }
    }

    // Only validate brandIds if some were actually provided
    if (brandObjectIds.length > 0) {
      const foundBrands = await this.brandRepo.find({
        filter: { _id: { $in: brandObjectIds } },
      });
      if (foundBrands.length !== brandObjectIds.length) {
        throw new NotFoundException('Some brands were not found');
      }
    }

    // Upload file after all validation passes
    let image!: string;
    if (file) {
      await verifyFileSignature(file, fileFieldValidation.image);
      try {
        image = await this.s3Service.uploadAsset({ file, path: 'Categories' });
      } catch (error) {
        console.log(error);
        throw new InternalServerErrorException(
          'S3 Bucket credentials missing or something went wrong with the service',
        );
      }
    }

    const updatedCategory = await this.categoryRepo.findByIdAndUpdate({
      _id: categoryObjectId,
      update: [
        {
          $set: {
            updatedBy: user._id,
            ...(name ? { name, slug: slugify(name) } : {}),
            ...(file ? { image } : {}),
            brandIds: {
              $setUnion: [
                {
                  $setDifference: ['$brandIds', removeBrandObjectIds],
                },
                brandObjectIds,
              ],
            },
          },
        },
      ],
      options: { lean: true },
    });

    if (!updatedCategory) {
      if (image) await this.s3Service.deleteAsset({ Key: image });
      throw new BadRequestException('Failed to update category');
    }

    // Clean up old S3 image only after a successful update
    if (file && ExistingCategory.image) {
      try {
        await this.s3Service.deleteAsset({ Key: ExistingCategory.image });
      } catch (error) {
        console.log('Failed to delete old S3 image:', error);
      }
    }

    return updatedCategory;
  }

  remove(id: number) {
    return `This action removes a #${id} category`;
  }
}
