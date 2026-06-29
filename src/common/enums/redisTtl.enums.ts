import { SetMetadata } from '@nestjs/common';

export const ttlName = 'ttlName';
export const ttl = (value: number = 10) => {
  return SetMetadata(ttlName, value);
};
export const personalCacheName = 'personalCacheName';
export const PersonalCache = (value: boolean = false) => {
  return SetMetadata(personalCacheName, value);
};
