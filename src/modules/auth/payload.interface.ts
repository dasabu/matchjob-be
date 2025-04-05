import { IUser } from 'src/modules/users/user.interface';

export interface IPayload extends Omit<IUser, 'permissions'> {
  iss: string;
  sub: string;
}
