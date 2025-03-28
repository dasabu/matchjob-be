import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import bcrypt from 'bcryptjs';

import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { email, name, password } = createUserDto;
    const hashedPassword = this.hashPassword(password);
    const newUser = await this.userModel.create({
      email,
      name,
      password: hashedPassword,
    });
    return newUser;
  }

  async findOneById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return `User id ${id} not found`;
    return await this.userModel.findOne({
      _id: id,
    });
  }

  async findOneByEmail(email: string) {
    return await this.userModel.findOne({
      email,
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    if (!mongoose.Types.ObjectId.isValid(id)) return `User id ${id} not found`;
    const updated = await this.userModel.updateOne(
      { _id: id },
      {
        ...updateUserDto,
      },
    );
    return updated;
  }

  async remove(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return `User id ${id} not found`;
    return await this.userModel.softDelete({
      _id: id,
    });
  }

  hashPassword(password: string) {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    return hashedPassword;
  }

  comparePassword(plainPassword: string, hashedPassword: string) {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  }
}
