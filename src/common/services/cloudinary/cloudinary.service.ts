import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AdminAndResourceOptions,
  UploadApiOptions,
  UploadApiResponse,
  v2 as cloudinary,
} from 'cloudinary';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';

import { StorageApproachEnum, UploadApproachEnum } from '../../enums';
import { IMulterFile } from 'src/common/interfaces';

/**
 * Cloudinary "type" replaces S3's ACL:
 *  - upload        -> public (S3: public-read)
 *  - authenticated -> every delivery needs a signature (closest to S3: private)
 *  - private       -> original is private, derived/transformed versions are public
 */
export type CloudinaryDeliveryType = 'upload' | 'authenticated' | 'private';
export type CloudinaryResourceType = 'image' | 'video' | 'raw' | 'auto';
// the SDK's Admin API methods are typed as Promise<any>
export type ApiResponse = Record<string, unknown>;

const ROOT_FOLDER = 'Social_App';
// Admin API allows at most 100 public ids per delete_resources call
const DELETE_BATCH_SIZE = 100;

/////////////////// implementing Cloudinary cloud storage for uploaded files
@Injectable()
export class CloudinaryService {
  private readonly CLOUDINARY_CLOUD_NAME: string;
  private readonly CLOUDINARY_API_KEY: string;
  private readonly CLOUDINARY_API_SECRET: string;
  private readonly CLOUDINARY_EXPIRES_IN: number;

  constructor(private readonly configService: ConfigService) {
    this.CLOUDINARY_CLOUD_NAME = this.configService.get<string>(
      'CLOUDINARY_CLOUD_NAME',
    ) as string;
    this.CLOUDINARY_API_KEY = this.configService.get<string>(
      'CLOUDINARY_API_KEY',
    ) as string;
    this.CLOUDINARY_API_SECRET = this.configService.get<string>(
      'CLOUDINARY_API_SECRET',
    ) as string;
    this.CLOUDINARY_EXPIRES_IN = Number(
      this.configService.get<string>('CLOUDINARY_EXPIRES_IN') ?? 3600,
    );

    cloudinary.config({
      cloud_name: this.CLOUDINARY_CLOUD_NAME,
      api_key: this.CLOUDINARY_API_KEY,
      api_secret: this.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  ///////////// helpers

  // Cloudinary public ids cannot contain some characters (& ? # % < > \)
  private sanitize(name: string): string {
    return name.replace(/[^\w.]+/g, '_');
  }

  /**
   * Builds the public_id (the Cloudinary equivalent of the S3 Key).
   * For images/videos the extension is dropped (Cloudinary tracks the format
   * separately). For raw files the extension must stay inside the public_id.
   */
  private buildPublicId(
    path: string,
    originalName: string,
    resourceType: CloudinaryResourceType,
    mimetype?: string,
  ): string {
    const safe = this.sanitize(originalName);
    const isMedia =
      resourceType === 'image' ||
      resourceType === 'video' ||
      (resourceType === 'auto' &&
        !!mimetype &&
        /^(image|video|audio)\//.test(mimetype));
    const name = isMedia ? safe.replace(/\.[^.]+$/, '') : safe;
    return `${ROOT_FOLDER}/${path}/${randomUUID()}__${name}`;
  }

  private buildOptions({
    public_id,
    resourceType,
    type,
    contentType,
  }: {
    public_id: string;
    resourceType: CloudinaryResourceType;
    type: CloudinaryDeliveryType;
    contentType?: string | undefined;
  }): UploadApiOptions {
    return {
      public_id,
      resource_type: resourceType,
      type,
      // keep the extension-less public_id
      use_filename: false,
      unique_filename: false,
      overwrite: false,
      ...(contentType ? { context: { content_type: contentType } } : {}),
    };
  }

  private uploadViaStream(
    uploadStream: NodeJS.WritableStream,
    source: Buffer | Readable,
  ): void {
    if (Buffer.isBuffer(source)) {
      uploadStream.end(source);
    } else {
      source.pipe(uploadStream);
    }
  }

  private getSource(
    storageApproach: StorageApproachEnum,
    file: IMulterFile,
  ): Buffer | Readable {
    return storageApproach === StorageApproachEnum.MEMORY
      ? file.buffer
      : createReadStream(file.path);
  }

  ///////////// uploading
  uploadAsset({
    storageApproach = StorageApproachEnum.MEMORY,
    path = 'General',
    file,
    type = 'authenticated',
    resourceType = 'auto',
    ContentType,
  }: {
    storageApproach?: StorageApproachEnum;
    path?: string;
    file: IMulterFile;
    type?: CloudinaryDeliveryType;
    resourceType?: CloudinaryResourceType;
    ContentType?: string | undefined;
  }): Promise<UploadApiResponse> {
    const public_id = this.buildPublicId(
      path,
      file.originalname,
      resourceType,
      file.mimetype || ContentType,
    );
    const options = this.buildOptions({
      public_id,
      resourceType,
      type,
      contentType: file.mimetype || ContentType,
    });
    const source = this.getSource(storageApproach, file);

    return new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error || !result) {
            return reject(
              new InternalServerErrorException(
                error?.message || 'Failed to upload this asset',
              ),
            );
          }
          resolve(result);
        },
      );
      if (!Buffer.isBuffer(source)) {
        source.on('error', reject);
      }
      this.uploadViaStream(uploadStream, source);
    });
  }

  /**
   * Chunked upload, required for files > 100 MB (mostly videos).
   * Cloudinary's minimum chunk size is 5 MB.
   */
  uploadLargeAssets({
    storageApproach = StorageApproachEnum.DISK,
    path = 'General',
    file,
    type = 'authenticated',
    resourceType = 'auto',
    ContentType,
    partSize = 5,
  }: {
    storageApproach?: StorageApproachEnum;
    path?: string;
    file: IMulterFile;
    type?: CloudinaryDeliveryType;
    resourceType?: CloudinaryResourceType;
    ContentType?: string | undefined;
    partSize?: number;
  }): Promise<UploadApiResponse> {
    const public_id = this.buildPublicId(
      path,
      file.originalname,
      resourceType,
      file.mimetype || ContentType,
    );
    const options: UploadApiOptions = {
      ...this.buildOptions({
        public_id,
        resourceType,
        type,
        contentType: file.mimetype || ContentType,
      }),
      chunk_size: partSize * 1024 * 1024,
    };
    const source = this.getSource(storageApproach, file);

    return new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_chunked_stream(
        options,
        (error, result) => {
          if (error) {
            return reject(
              new InternalServerErrorException(
                error.message || 'Failed to upload this asset',
              ),
            );
          }
          // the callback also fires for intermediate chunks, the final
          // response is the one that carries the public_id
          if (result?.public_id) {
            console.log(`File upload finished: ${result.public_id}`);
            resolve(result);
          }
        },
      );
      if (!Buffer.isBuffer(source)) {
        source.on('error', reject);
      }
      this.uploadViaStream(uploadStream, source);
    });
  }

  async uploadMultipleAssets({
    storageApproach = StorageApproachEnum.MEMORY,
    uploadApproach = UploadApproachEnum.SMALL,
    path = 'General',
    files,
    type = 'authenticated',
    resourceType = 'auto',
    ContentType,
  }: {
    storageApproach?: StorageApproachEnum;
    uploadApproach?: UploadApproachEnum;
    path?: string;
    files: IMulterFile[];
    type?: CloudinaryDeliveryType;
    resourceType?: CloudinaryResourceType;
    ContentType?: string;
  }): Promise<string[]> {
    const results = await Promise.all(
      files.map((file) =>
        uploadApproach === UploadApproachEnum.LARGE
          ? this.uploadLargeAssets({
              storageApproach,
              file,
              type,
              resourceType,
              ContentType,
              path,
            })
          : this.uploadAsset({
              storageApproach,
              file,
              type,
              resourceType,
              ContentType,
              path,
            }),
      ),
    );
    // public_ids, the equivalent of the S3 keys you store in the database
    return results.map((result) => result.public_id);
  }

  //////////// signed params for direct browser -> Cloudinary upload
  // (Cloudinary has no presigned PUT url, the client POSTs a FormData with
  // `file` + the params returned here to the returned `url`)
  createPresignedUploadLink({
    path = 'General',
    originalName,
    resourceType = 'auto',
    type = 'authenticated',
  }: {
    path?: string | undefined;
    originalName: string;
    resourceType?: CloudinaryResourceType;
    type?: CloudinaryDeliveryType;
  }): {
    url: string;
    Key: string;
    params: {
      api_key: string;
      timestamp: number;
      signature: string;
      public_id: string;
      type: CloudinaryDeliveryType;
    };
  } {
    const public_id = this.buildPublicId(
      path ?? 'General',
      originalName,
      resourceType,
    );
    const timestamp = Math.round(Date.now() / 1000);
    // only sign the params the client will actually send (not file/api_key/resource_type)
    const signature = cloudinary.utils.api_sign_request(
      { public_id, timestamp, type },
      this.CLOUDINARY_API_SECRET,
    );
    if (!public_id || !signature) {
      throw new InternalServerErrorException('Failed to upload this asset');
    }
    return {
      url: `https://api.cloudinary.com/v1_1/${this.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      Key: public_id,
      params: {
        api_key: this.CLOUDINARY_API_KEY,
        timestamp,
        signature,
        public_id,
        type,
      },
    };
  }

  //////////// creating a link for getting or fetching a file
  createPresignedFetchLink({
    Key,
    expiresIn = this.CLOUDINARY_EXPIRES_IN,
    filename,
    download,
    resourceType = 'image',
    type = 'authenticated',
    format,
  }: {
    // Key is the public_id received by the params from front-end
    Key: string;
    expiresIn?: number;
    filename?: string;
    download?: string;
    resourceType?: Exclude<CloudinaryResourceType, 'auto'>;
    type?: CloudinaryDeliveryType;
    // file extension (without the dot) for image/video, e.g. 'jpg'.
    // Leave empty for raw files because their extension is part of the public_id
    format?: string;
  }): string {
    if (!Key) {
      throw new InternalServerErrorException(
        'Failed to get this asset no specified key received',
      );
    }
    const isDownload = download === 'true';
    const downloadName = (filename || Key.split('/').pop() || 'file').replace(
      /\.[^.]+$/,
      '',
    );

    // public asset: plain delivery url, no signature needed
    if (type === 'upload') {
      return cloudinary.url(Key, {
        resource_type: resourceType,
        type,
        secure: true,
        ...(format ? { format } : {}),
        ...(isDownload
          ? { flags: `attachment:${this.sanitize(downloadName)}` }
          : {}),
      });
    }

    // private/authenticated + download: time-limited signed url (Admin download endpoint)
    if (isDownload) {
      return cloudinary.utils.private_download_url(Key, format ?? '', {
        resource_type: resourceType,
        type,
        attachment: true,
        expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      });
    }

    // private/authenticated + inline view: signed delivery url.
    // NOTE: this signature does not expire unless you enable token-based
    // authentication on your account (cloudinary.utils.generate_auth_token)
    return cloudinary.url(Key, {
      resource_type: resourceType,
      type,
      secure: true,
      sign_url: true,
      ...(format ? { format } : {}),
    });
  }

  ///////////// streaming a file through your server (like S3's GetObject Body)
  async getAssetStream({
    Key,
    resourceType = 'image',
    type = 'authenticated',
    format,
  }: {
    Key: string;
    resourceType?: Exclude<CloudinaryResourceType, 'auto'>;
    type?: CloudinaryDeliveryType;
    format?: string;
  }): Promise<{
    stream: Readable;
    contentType: string;
    contentLength?: number;
  }> {
    // signed (or public) delivery url, only used server-side here
    const url = this.createPresignedFetchLink({
      Key,
      resourceType,
      type,
      ...(format ? { format } : {}),
    });
    const response = await fetch(url);
    if (response.status === 404 || response.status === 401) {
      throw new NotFoundException('Asset not found');
    }
    if (!response.ok || !response.body) {
      throw new InternalServerErrorException('Failed to fetch this asset');
    }
    const length = response.headers.get('content-length');
    return {
      stream: Readable.fromWeb(response.body as never),
      contentType:
        response.headers.get('content-type') ?? 'application/octet-stream',
      ...(length ? { contentLength: Number(length) } : {}),
    };
  }

  ///////////// getting and deleting assets
  // S3 returned the object stream; Cloudinary returns the asset's metadata
  // (use createPresignedFetchLink to give the client the actual file)
  async getAsset({
    Key,
    resourceType = 'image',
    type = 'authenticated',
  }: {
    Key: string;
    resourceType?: Exclude<CloudinaryResourceType, 'auto'>;
    type?: CloudinaryDeliveryType;
  }): Promise<ApiResponse> {
    if (!Key) {
      throw new InternalServerErrorException(
        'Failed to get this asset no specified key received',
      );
    }
    return (await cloudinary.api.resource(Key, {
      resource_type: resourceType,
      type,
    })) as Promise<ApiResponse>;
  }

  // Cloudinary deletes per resource_type + type, so pass the right ones
  async deleteMultipleAssets({
    Keys,
    resourceType = 'image',
    type = 'authenticated',
  }: {
    Keys: string[];
    resourceType?: Exclude<CloudinaryResourceType, 'auto'>;
    type?: CloudinaryDeliveryType;
  }): Promise<ApiResponse[]> {
    if (!Keys?.length) {
      throw new InternalServerErrorException(
        'Failed to get this asset no specified key received',
      );
    }
    const results: ApiResponse[] = [];
    for (let i = 0; i < Keys.length; i += DELETE_BATCH_SIZE) {
      results.push(
        await cloudinary.api.delete_resources(
          Keys.slice(i, i + DELETE_BATCH_SIZE),
          { resource_type: resourceType, type },
        ),
      );
    }
    return results;
  }

  async deleteAsset({
    Key,
    resourceType = 'image',
    type = 'authenticated',
    invalidate = false,
  }: {
    Key: string;
    resourceType?: Exclude<CloudinaryResourceType, 'auto'>;
    type?: CloudinaryDeliveryType;
    // also purge the CDN cache
    invalidate?: boolean;
  }): Promise<{ result: string }> {
    if (!Key) {
      throw new InternalServerErrorException(
        'Failed to get this asset no specified key received',
      );
    }
    return (await cloudinary.uploader.destroy(Key, {
      resource_type: resourceType,
      type,
      invalidate,
    })) as Promise<{ result: string }>;
  }

  async listFolderDir({
    prefix,
    resourceType = 'image',
    type = 'authenticated',
    maxResults = 100,
    nextCursor,
  }: {
    prefix: string;
    resourceType?: Exclude<CloudinaryResourceType, 'auto'>;
    type?: CloudinaryDeliveryType;
    maxResults?: number;
    nextCursor?: string;
  }): Promise<ApiResponse> {
    if (!prefix) {
      throw new InternalServerErrorException(
        'A prefix is required in order to list folder dir',
      );
    }
    return (await cloudinary.api.resources({
      resource_type: resourceType,
      type,
      prefix: `${ROOT_FOLDER}/${prefix}`,
      max_results: maxResults,
      ...(nextCursor ? { next_cursor: nextCursor } : {}),
    })) as Promise<ApiResponse>;
  }

  /**
   * Deletes everything under a prefix. Cloudinary separates assets by
   * resource_type, so every type (image, video, raw) is cleaned unless you
   * pass specific ones.
   */
  async deleteFolderByPrefix({
    prefix,
    type = 'authenticated',
    resourceTypes = ['image', 'video', 'raw'],
  }: {
    prefix: string;
    type?: CloudinaryDeliveryType;
    resourceTypes?: Exclude<CloudinaryResourceType, 'auto'>[];
  }): Promise<ApiResponse[]> {
    if (!prefix) {
      throw new InternalServerErrorException(
        'A prefix is required in order to delete a folder',
      );
    }
    const fullPrefix = `${ROOT_FOLDER}/${prefix}`;
    const results: ApiResponse[] = [];
    for (const resource_type of resourceTypes) {
      results.push(
        await cloudinary.api.delete_resources_by_prefix(fullPrefix, {
          resource_type,
          type,
        }),
      );
    }
    return results;
  }
}
