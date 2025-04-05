import { Permission } from '../permissions/schemas/permission.schema';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: {
    _id: string;
    name: string;
  };
  permissions: Permission[];
  // permissions?: {
  //   _id: string;
  //   name: string;
  //   apiPath: string;
  //   module: string;
  // }[];
}
