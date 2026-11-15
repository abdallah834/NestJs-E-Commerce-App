import {
  // ArgumentMetadata,
  BadRequestException,
  // BadRequestException,
  Injectable,
  PipeTransform,
  ParseFilePipe,
  FileTypeValidator,
} from '@nestjs/common';
import { ZodType } from 'zod';

@Injectable()
export class CustomValidationPipe<T = any> implements PipeTransform {
  constructor(private schema: ZodType) {}
  transform(
    value: T,
    // metadata: ArgumentMetadata
  ) {
    // const [firstName, lastName] = value.userName.split(' ') || [];
    // if (!firstName || !lastName) {
    //   throw new BadRequestException('Invalid username format');
    // }
    // if (value.password !== value.confirmPassword) {
    //   throw new BadRequestException('passwords mismatch');
    // }
    // value.firstName = firstName;
    // value.lastName = lastName;
    const { success, error } = this.schema.safeParse(value);
    if (!success) {
      throw new BadRequestException({
        message: 'Validation error',
        cause: {
          issues: error.issues.map((issue) => {
            return { path: issue.path, message: issue.message };
          }),
        },
      });
    }
    return value;
  }
}

@Injectable()
export class FileFieldsValidationPipe implements PipeTransform {
  private readonly pipe = new ParseFilePipe({
    validators: [
      new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png)$/ }),
    ],
  });

  async transform(files: Record<string, Express.Multer.File[]>) {
    const flat = Object.values(files ?? {}).flat();
    await this.pipe.transform(flat); // throws if any file is invalid
    return files; // keep the original shape
  }
}
