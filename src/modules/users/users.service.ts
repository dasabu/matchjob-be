import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { SignUpUserDto } from './dtos/sign-up-user.dto';
import { IUser } from './user.interface';
import aqp from 'api-query-params';
import { Role, RoleDocument } from '../roles/schemas/role.schema';
import { USER_ROLE } from '../mongo/sample';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>,
    @InjectModel(Role.name) private roleModel: SoftDeleteModel<RoleDocument>,
  ) {}

  /**
   * API
   */

  async findOneById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new BadRequestException(`User id ${id} not found`);
    return await this.userModel
      .findOne({
        _id: id,
      })
      .select('-password')
      .populate({ path: 'role', select: { _id: 1, name: 1 } });
  }

  async findAll(current: number, pageSize: number, qs: string) {
    const { filter, sort, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    const offset = (current - 1) * pageSize;

    const totalItems = (await this.userModel.find(filter)).length;

    const totalPages = Math.ceil(totalItems / pageSize);

    const result = await this.userModel
      .find(filter)
      .skip(offset)
      .limit(pageSize)
      .sort(sort as any)
      .select('-password')
      .populate(population)
      .exec();

    return {
      meta: {
        current,
        pageSize,
        pages: totalPages,
        total: totalItems,
      },
      result,
    };
  }

  async create(createUserDto: CreateUserDto, user: IUser) {
    const isExistedEmail = await this.findOneByEmail(createUserDto.email);
    if (isExistedEmail) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = this.hashPassword(createUserDto.password);
    const newUser = await this.userModel.create({
      ...createUserDto,
      role: 'USER',
      password: hashedPassword,
      createdBy: {
        _id: user._id,
        email: user.email,
      },
    });
    return newUser;
  }

  async update(id: string, updateUserDto: UpdateUserDto, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new BadRequestException(`User id ${id} not found`);
    const updated = await this.userModel.updateOne(
      { _id: id },
      {
        ...updateUserDto,
        updatedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );
    return updated;
  }

  async remove(id: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new BadRequestException(`User id ${id} not found`);
    await this.userModel.updateOne(
      {
        _id: id,
      },
      {
        deletedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );
    return await this.userModel.softDelete({
      _id: id,
    });
  }

  async signUp(signUpUserDto: SignUpUserDto) {
    const user = await this.findOneByEmail(signUpUserDto.email);
    if (user) {
      throw new BadRequestException('Email already exists');
    }

    const role = await this.roleModel.findOne({ name: USER_ROLE });

    const hashedPassword = this.hashPassword(signUpUserDto.password);
    return await this.userModel.create({
      ...signUpUserDto,
      role,
      password: hashedPassword,
    });
  }

  /**
   * Helper
   */

  hashPassword(password: string) {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    return hashedPassword;
  }

  comparePassword(plainPassword: string, hashedPassword: string) {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  }

  async updateUserToken(id: string, refreshToken: string) {
    return await this.userModel.updateOne(
      {
        _id: id,
      },
      {
        refreshToken,
      },
    );
  }

  async findOneByEmail(email: string) {
    return await this.userModel.findOne({
      email,
    });
    // .populate({ path: 'role', select: { name: 1, permissions: 1 } });
  }

  async findUserByToken(refreshToken: string) {
    return await this.userModel.findOne({
      refreshToken,
    });
  }
}
