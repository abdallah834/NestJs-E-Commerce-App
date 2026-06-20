import { Injectable } from '@nestjs/common';
import { IMulterFile, IUser } from 'src/common/interfaces';
import { UserRepo } from 'src/common/repository';
import { S3Service } from 'src/common/services';
import {
  fileFieldValidation,
  verifyFileSignature,
} from 'src/common/utils/multer';
import { hydratedUserDocument } from 'src/models';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepo,
    private readonly s3Service: S3Service,
  ) {}
  //////////////////////////////////////////////////////////////////////////////////////
  ///////// User profile
  async profile({ email }: { email: string }) {
    const profile = await this.userRepository.findOne({ filter: { email } });
    return profile?.toJSON();
  }
  async uploadS3ProfileImage(
    file: IMulterFile,
    user: hydratedUserDocument,
  ): Promise<IUser> {
    ///////using file-type package to validate the type of the uploaded user file to make sure it's not a .exe
    await verifyFileSignature(file, fileFieldValidation.image);
    const oldImage = user.profileImage;
    user.profileImage = await this.s3Service.uploadAsset({
      file,
      path: `Users/${user._id.toString()}`,
    });
    if (oldImage) {
      await this.s3Service.deleteAsset({ Key: oldImage });
    }
    return user.toJSON();
  }
  async getPresignedFetchLink() {}
  //////////////////////////////////////////////////////////////////////////////////////
}
