import { S3ServiceException } from '@aws-sdk/client-s3';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mongo } from 'mongoose';
import { slugify } from 'node_modules/zod/v4/core/util.cjs';
import { IMulterFile, IProduct } from 'src/common/interfaces';
import { BrandRepo, CategoryRepo, ProductRepo } from 'src/common/repository';
import { S3Service } from 'src/common/services';
import {
  fileFieldValidation,
  verifyFileSignature,
} from 'src/common/utils/multer';
import { hydratedUserDocument } from 'src/models';
import { CreateProductDto } from './dto/create-product.dto';
import {
  UpdateProductDto,
  UpdateProductParamsDto,
} from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly brandRepo: BrandRepo,
    private readonly categoryRepo: CategoryRepo,
    private readonly productRepo: ProductRepo,
  ) {}
  async create(
    {
      name,
      description,
      stock,
      salePrice,
      originalPrice,
      brandId,
      categoryId,
      discountPercentage = 0,
    }: CreateProductDto,
    user: hydratedUserDocument,
    files: { image: IMulterFile[]; gallery?: IMulterFile[] },
  ): Promise<IProduct> {
    brandId = mongo.ObjectId.createFromHexString(brandId as string);
    categoryId = mongo.ObjectId.createFromHexString(categoryId as string);
    const checkExistingBrandId = await this.brandRepo.findOne({
      filter: { _id: brandId },
    });
    if (!checkExistingBrandId) {
      throw new NotFoundException('Failed to find a matching brand');
    }
    const checkExistingCategoryId = await this.categoryRepo.findOne({
      filter: { _id: categoryId },
    });
    if (!checkExistingCategoryId) {
      throw new NotFoundException('Failed to find a matching category');
    }

    const finalPrice = Number(
      discountPercentage
        ? salePrice - (salePrice * discountPercentage) / 100
        : salePrice,
    ).toFixed(2);
    ///////// validating file buffer
    await verifyFileSignature(files.image[0], fileFieldValidation.image);
    const referenceId = randomUUID().slice(0, 6);

    let image: string;
    let productGallery: string[] = [];

    try {
      image = await this.s3Service.uploadAsset({
        file: files.image[0],
        path: `Products/${referenceId}`,
      });
      if (files.gallery?.length) {
        productGallery = await this.s3Service.uploadMultipleAssets({
          files: files.gallery,
          path: `Products/${referenceId}/gallery`,
        });
      }
    } catch (error) {
      if (error instanceof S3ServiceException) {
        throw new BadRequestException('Failed to upload product assets');
      } else {
        throw error;
      }
    }

    const product = await this.productRepo.createOne({
      data: {
        name,
        description,
        stock,
        salePrice,
        originalPrice,
        finalPrice,
        brandId,
        categoryId,
        referenceId,
        image,
        gallery: productGallery,
        createdBy: user._id,
      },
    });

    if (!product) {
      await this.s3Service.deleteFolderByPrefix({
        prefix: `Products/${referenceId}`,
      });
      throw new BadRequestException('Failed to create product');
    }
    return product.toJSON();
  }
  private async deleteProductAttachments(image?: string, gallery?: string[]) {
    try {
      const imageKeys: { Key: string }[] = [];
      if (image) {
        imageKeys.push({ Key: image });
      } else if (gallery?.length) {
        imageKeys.push(
          ...gallery.map((pGallery) => {
            return { Key: pGallery };
          }),
        );
      }
      await this.s3Service.deleteMultipleAssets({ Keys: imageKeys });
    } catch (error) {
      if (error instanceof S3ServiceException) {
        throw new BadRequestException(
          'Failed to delete multiple product assets',
        );
      } else {
        throw error;
      }
    }
  }
  findAll() {
    return `This action returns all product`;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  async update(
    { productId }: UpdateProductParamsDto,
    {
      brandId,
      categoryId,
      description,
      discountPercentage,
      name,
      originalPrice,
      removeGallery = [],
      salePrice,
      stock,
    }: UpdateProductDto,
    user: hydratedUserDocument,
    files?: { image?: IMulterFile[]; gallery?: IMulterFile[] },
  ) {
    if (brandId) {
      brandId = mongo.ObjectId.createFromHexString(brandId as string);
    }
    if (categoryId) {
      categoryId = mongo.ObjectId.createFromHexString(categoryId as string);
    }
    ///////////////////// checking existing product
    const existingProduct = await this.productRepo.findOne({
      filter: { _id: productId, paranoid: false },
    });
    if (!existingProduct) {
      throw new NotFoundException('Failed to find a matching product');
    }
    ///////////////////// checking existing brand and category
    const checkExistingBrandId = await this.brandRepo.findOne({
      filter: { _id: brandId },
    });
    if (!checkExistingBrandId) {
      throw new NotFoundException("Failed to find product's brand");
    }
    const checkExistingCategoryId = await this.categoryRepo.findOne({
      filter: { _id: categoryId },
    });
    if (!checkExistingCategoryId) {
      throw new NotFoundException("Failed to find product's category");
    }
    let finalPrice: number = existingProduct.finalPrice;
    //////////////// all values are strings
    if (originalPrice || discountPercentage || salePrice) {
      originalPrice ??= existingProduct.originalPrice;
      discountPercentage ??= existingProduct.discountPercentage;
      salePrice ??= existingProduct.salePrice;

      if (salePrice < originalPrice) {
        throw new BadRequestException(
          "salePrice can't be less than originalPrice",
        );
      }
      finalPrice = discountPercentage
        ? salePrice - (salePrice * discountPercentage) / 100
        : salePrice;
    }
    let image: string = existingProduct.image;
    if (files?.image?.length) {
      try {
        image = await this.s3Service.uploadAsset({
          file: files.image[0],
          path: `Products/${existingProduct.referenceId}`,
        });
      } catch (error) {
        if (error instanceof S3ServiceException) {
          throw new BadRequestException('Failed to upload product assets');
        } else {
          throw error;
        }
      }
    }
    let productGallery: string[] = existingProduct.gallery || [];
    if (files?.gallery?.length) {
      try {
        productGallery = await this.s3Service.uploadMultipleAssets({
          files: productGallery as unknown as IMulterFile[],
          path: `Products/${existingProduct.referenceId}/gallery`,
        });
      } catch (error) {
        if (error instanceof S3ServiceException) {
          throw new BadRequestException('Failed to upload product assets');
        } else {
          throw error;
        }
      }
    }
    const updatedProduct = await this.productRepo.findOneAndUpdate({
      filter: { _id: productId, paranoid: false },
      update: [
        {
          $set: {
            ...(name ? { name, slug: slugify(name) } : {}),
            ...(description ? { description } : {}),
            ...(brandId ? { brandId } : {}),
            ...(categoryId ? { categoryId } : {}),
            ...(stock ? { stock } : {}),
            discountPercentage,
            originalPrice,
            salePrice,
            finalPrice,
            image,
            // whenever we want to remove an old value and replace it with a newer one we use setUnion
            gallery: {
              $setUnion: [
                { $setDifference: ['$gallery', removeGallery] },
                productGallery,
              ],
            },
            updatedBy: user._id,
          },
        },
      ],
    });
    if (!updatedProduct) {
      await this.deleteProductAttachments(
        !files?.image?.length ? image : undefined,
        productGallery,
      );
      throw new BadRequestException('Failed to create product');
    }
    await this.deleteProductAttachments(
      files?.image?.length ? image : undefined,
      removeGallery,
    );
    return updatedProduct.toJSON();
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
