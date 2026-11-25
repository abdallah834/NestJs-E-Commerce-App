import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { tmpdir } from 'node:os';

import { StorageApproachEnum, UploadApproachEnum } from '../../enums';
import type { IMulterFile } from 'src/common/interfaces';
import type { CloudinaryDeliveryType } from '../../types/index';
import { CloudinaryService } from './cloudinary.service';

type MediaResourceType = 'image' | 'video' | 'raw';

const SMALL_LIMIT = 10 * 1024 * 1024; // 10 MB in memory
const LARGE_LIMIT = 500 * 1024 * 1024; // 500 MB on disk

@Controller('storage')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  // small file, kept in memory
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: SMALL_LIMIT },
    }),
  )
  async upload(@UploadedFile() file: IMulterFile) {
    if (!file) throw new BadRequestException('file is required');
    const result = await this.cloudinaryService.uploadAsset({
      file,
      storageApproach: StorageApproachEnum.MEMORY,
      path: 'posts',
    });
    return { key: result.public_id, url: result.secure_url };
  }

  // several small files
  @Post('upload-many')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: { fileSize: SMALL_LIMIT },
    }),
  )
  async uploadMany(@UploadedFiles() files: IMulterFile[]) {
    if (!files?.length) throw new BadRequestException('files are required');
    const keys = await this.cloudinaryService.uploadMultipleAssets({
      files,
      storageApproach: StorageApproachEnum.MEMORY,
      uploadApproach: UploadApproachEnum.SMALL,
      path: 'posts',
    });
    return { keys };
  }

  // large file (videos): written to disk first, then sent in chunks
  @Post('upload-large')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({ destination: tmpdir() }),
      limits: { fileSize: LARGE_LIMIT },
    }),
  )
  async uploadLarge(@UploadedFile() file: IMulterFile) {
    if (!file) throw new BadRequestException('file is required');
    const result = await this.cloudinaryService.uploadLargeAssets({
      file,
      storageApproach: StorageApproachEnum.DISK,
      resourceType: 'video',
      path: 'videos',
    });
    // optionally unlink(file.path) here to clean the temp file
    return { key: result.public_id, url: result.secure_url };
  }

  // signed params so the browser uploads straight to Cloudinary
  @Get('presigned-upload')
  presignedUpload(
    @Query('name') name: string,
    @Query('resourceType')
    resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto',
  ) {
    if (!name) throw new BadRequestException('name is required');
    return this.cloudinaryService.createPresignedUploadLink({
      originalName: name,
      path: 'posts',
      resourceType,
    });
  }

  // link for the client to view/download the file
  @Get('link')
  link(
    @Query('key') key: string,
    @Query('resourceType') resourceType: MediaResourceType = 'image',
    @Query('type') type: CloudinaryDeliveryType = 'authenticated',
    @Query('format') format?: string,
    @Query('download') download?: string,
    @Query('filename') filename?: string,
  ) {
    const url = this.cloudinaryService.createPresignedFetchLink({
      Key: key,
      resourceType,
      type,
      ...(format ? { format } : {}),
      ...(download ? { download } : {}),
      ...(filename ? { filename } : {}),
    });
    return { url };
  }

  // file proxied through your server (the getAssetStream equivalent of S3 GetObject)
  @Get('stream')
  async stream(
    @Query('key') key: string,
    @Query('resourceType') resourceType: MediaResourceType = 'image',
    @Query('type') type: CloudinaryDeliveryType = 'authenticated',
    @Query('format') format?: string,
  ) {
    const { stream, contentType, contentLength } =
      await this.cloudinaryService.getAssetStream({
        Key: key,
        resourceType,
        type,
        ...(format ? { format } : {}),
      });
    return new StreamableFile(stream, {
      type: contentType,
      ...(contentLength ? { length: contentLength } : {}),
    });
  }

  @Delete()
  async remove(
    @Query('key') key: string,
    @Query('resourceType') resourceType: MediaResourceType = 'image',
    @Query('type') type: CloudinaryDeliveryType = 'authenticated',
  ) {
    return this.cloudinaryService.deleteAsset({
      Key: key,
      resourceType,
      type,
      invalidate: true,
    });
  }
}
