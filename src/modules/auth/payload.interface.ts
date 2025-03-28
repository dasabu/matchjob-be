import { IUser } from 'src/modules/users/user.interface';

export interface IPayload extends IUser {
  iss: string;
  sub: string;
}
