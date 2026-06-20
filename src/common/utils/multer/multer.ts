import { S3Client } from '@aws-sdk/client-s3';
import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomUUID } from 'crypto';
import type { Request } from 'express';
import { fileTypeFromBuffer } from 'file-type';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage, memoryStorage } from 'multer';
import { tmpdir } from 'os';
import { resolve } from 'path';
import { StorageApproachEnum } from 'src/common/enums';
import { IMulterFile } from 'src/common/interfaces';
export const fileFieldValidation = {
  image: ['image/jpeg', 'image/jpg', 'image/png'],
  video: ['video/mp4'],
};
export const LocalMulter = ({
  validation = [],
  folder = 'public',
  // fileSize = 3,
}: {
  validation: string[];
  folder?: string;
  fileSize?: number;
}) => {
  return {
    storage: diskStorage({
      destination(
        req: Request,
        file: IMulterFile,
        callback: (error: Error | null, destination: string) => void,
      ) {
        const fullPath = resolve(`./uploads/${folder}`);
        if (!existsSync(fullPath)) {
          mkdirSync(fullPath, { recursive: true });
        }
        return callback(null, fullPath);
      },
      filename(
        req: Request,
        file: IMulterFile,
        callback: (error: Error | null, destination: string) => void,
      ) {
        const uniqueFileName = randomUUID() + '_' + file.originalname;
        file.finalPath = `uploads/${folder}`;
        callback(null, uniqueFileName);
      },
    }),
    fileFilter(
      req: Request,
      file: IMulterFile,
      callback: (error: Error | null, acceptFile?: boolean) => void,
    ) {
      if (validation.includes(file.mimetype) === false) {
        callback(new BadRequestException('Invalid file format'));
      }
      callback(null, true);
    },
    // limits: fileSize * 1024 * 1024,
  };
};

const DEFAULT_MAX_SIZE_MB = 2;
const MAX_FILENAME_LENGTH = 100;

function sanitizeOriginalName(originalname: string): string {
  const base = originalname
    .replace(/\0/g, '')
    .replace(/^.*[\\/]/, '') // drop any path component (traversal defense)
    .replace(/[^a-zA-Z0-9._-]/g, '_');

  return base.slice(-MAX_FILENAME_LENGTH) || 'file';
}

interface CloudMulterParams {
  storageApproach?: StorageApproachEnum;
  validation?: string[];
  maxSize?: number; // MB
  bucket?: string;
  s3Client?: S3Client;
  keyPrefix?: string;
}
export const cloudMulter = ({
  storageApproach = StorageApproachEnum.MEMORY,
  validation = [],
  maxSize = DEFAULT_MAX_SIZE_MB,
  bucket,
  s3Client,
}: CloudMulterParams): MulterOptions => {
  if (storageApproach === StorageApproachEnum.DISK && (!bucket || !s3Client)) {
    throw new Error(
      'bucket and s3Client are required when storageApproach is S3',
    );
  }

  return {
    storage:
      storageApproach === StorageApproachEnum.MEMORY
        ? memoryStorage()
        : diskStorage({
            destination(
              req: Request,
              file: IMulterFile,
              callback: (error: Error | null, destination: string) => void,
            ) {
              callback(null, tmpdir());
            },
            filename(
              req: Request,
              file: IMulterFile,
              callback: (error: Error | null, destination: string) => void,
            ) {
              const uniqueFileName = `${randomUUID()}_${sanitizeOriginalName(file.originalname)}`;

              // file.finalPath = `uploads/${folder}`;
              callback(null, `uploads/${uniqueFileName}`);
            },
          }),
    limits: {
      fileSize: maxSize * 1024 * 1024,
    },
    fileFilter(req: Request, file: IMulterFile, callback) {
      if (!validation.includes(file.mimetype)) {
        return callback(
          new BadRequestException(
            `Invalid file format. Allowed: ${validation.join(', ')}`,
          ),
          false,
        );
      }
      return callback(null, true);
    },
  };
};

export async function verifyFileSignature(
  files: IMulterFile | IMulterFile[],
  allowedMimeTypes: string[],
): Promise<void> {
  const fileList = Array.isArray(files) ? files : [files];

  await Promise.all(
    fileList.map(async (file) => {
      if (!file.buffer) {
        throw new BadRequestException(
          'verifyFileSignature requires memoryStorage (file.buffer is empty)',
        );
      }

      const detected = await fileTypeFromBuffer(file.buffer);

      if (!detected || !allowedMimeTypes.includes(detected.mime)) {
        throw new BadRequestException(
          'File content does not match an allowed file type',
        );
      }

      if (detected.mime !== file.mimetype) {
        throw new BadRequestException(
          'Declared file type does not match actual file content',
        );
      }
    }),
  );
}
