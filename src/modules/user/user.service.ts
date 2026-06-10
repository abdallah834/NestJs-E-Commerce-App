import { Injectable } from '@nestjs/common';
import { UserRepo } from 'src/common/repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepo) {}
  async profile({ email }: { email: string }) {
    const profile = await this.userRepository.findOne({ filter: { email } });
    return profile?.toJSON();
  }
}
