import { SetMetadata } from '@nestjs/common';
import { RoleEnums } from '../enums';

export const roleName = 'roles';
export const Role = (roles: RoleEnums[] = [RoleEnums.USER]) =>
  SetMetadata(roleName, roles);
