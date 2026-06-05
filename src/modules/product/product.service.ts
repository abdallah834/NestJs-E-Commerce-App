import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductService {
  constructor() {}
  listProducts() {
    return [{ ID: 1, name: 'IPhone' }];
  }
}
