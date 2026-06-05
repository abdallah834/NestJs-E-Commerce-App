import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor() {}
  profile() {
    return { ID: 211, userName: 'TestName', age: '22' };
  }
}
