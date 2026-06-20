import {
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  Req,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import type { Request } from 'express';
import { Auth, User } from 'src/common/decorators';
import { RoleEnums } from 'src/common/enums';
import type { IMulterFile, IUser } from 'src/common/interfaces';
import { S3Service } from 'src/common/services';
import { cloudMulter, fileFieldValidation } from 'src/common/utils/multer';
import type { hydratedUserDocument } from 'src/models';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly s3Service: S3Service,
  ) {}
  //to handle the endpoints that use access tokens or refresh tokens we use SetMetadata along with the guard
  // @Token()
  // // handling user profile form the AuthenticationGuard and request
  // @Role([RoleEnums.ADMIN])
  // @UseGuards(AuthenticationGuard, AuthorizationGuard)
  /////////////////////////////////////////////////////////////////
  /////////////////////////////////////// getting user profile
  @Auth({ roles: [RoleEnums.USER] })
  @Get('profile')
  profile(@Req() req: Request, @User() user: hydratedUserDocument): IUser {
    // const user = await this.userService.profile(body);
    return user;
  }
  /////////////////////////////////////////////////////////////////
  /////////////////////////////////////// uploading user profile image using S3Bucket
  @UseInterceptors(
    ///////////////////important there's FileInterceptor and FilesInterceptor
    FileInterceptor(
      'attachment',
      cloudMulter({ validation: fileFieldValidation.image }),
    ),
  )
  @Patch('profile-image')
  async AddUserProfileImage(
    // ParseFilePipe makes the uploaded file required by default
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 3 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png)$/ }),
        ],
      }),
    )
    file: IMulterFile,
    // @Req()
    // req: Request,
    @User() user: hydratedUserDocument,
  ): Promise<IUser> {
    // const user = await this.userService.profile(body);
    return await this.userService.uploadS3ProfileImage(file, user);
  }
  /////////////////////////////////////////////////////////////////
  /////////////////////////////////////// uploading user profile cover images
  @UseInterceptors(
    FilesInterceptor(
      'attachments',
      3,
      cloudMulter({ validation: fileFieldValidation.image }),
    ),
  )
  @Patch('profile-cover-images')
  AddUserProfileCoverImages(
    // ParseFilePipe makes the uploaded file required by default
    @UploadedFiles(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [new MaxFileSizeValidator({ maxSize: 3 * 1024 * 1024 })],
      }),
    )
    files: Array<IMulterFile>,
    // @Req()
    // req: Request,
    // @User() user: hydratedUserDocument,
  ) {
    // const user = await this.userService.profile(body);
    return files;
  }
  /////////////////////////////////////////////////////////////////
  /////////////////////////////////////// uploading multiple files in general ex:(profile image:attachment,cover images:attachments)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profile-image', maxCount: 1 },
        { name: 'cover-images', maxCount: 3 },
      ],
      cloudMulter({ validation: fileFieldValidation.image }),
    ),
  )
  @Patch('upload/files')
  uploadMultipleFiles(
    // ParseFilePipe makes the uploaded file required by default
    @UploadedFiles(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png)$/ }),
        ],
      }),
    )
    files: {
      profileImage: Array<IMulterFile>;
      coverImages: Array<IMulterFile>[];
    },
    // @Req()
    // req: Request,
    // @User() user: hydratedUserDocument,
  ) {
    // const user = await this.userService.profile(body);
    return files;
  }

  /////////////////////////////////////////////////////////////////
  /////////////////////////////////////// getting presigned S3 url for an image
  @Get('/presigned/*path')
  async getPresignedImageUrl(@Req() req: Request) {
    // destructuring filename from query in order to set the downloaded file name
    const { download, filename } = req.query as {
      download: string;
      filename: string;
    };
    const { path } = req.params as { path: string[] };
    const Key = path.join('/');
    return await this.s3Service.createPresignedFetchLink({
      Key,
      download,
      filename,
    });

    // if (download === 'true') {
    //   res.setHeader(
    //     'Content-Disposition',
    //     `attachment; filename="${filename || path.pop()}"`,
    //   );
    // }
  }
}
