import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { Injectable, Query } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Company, CompanyDocument } from './schemas/company.schema';
import { IUser } from 'src/modules/users/user.interface';
import mongoose from 'mongoose';
import aqp from 'api-query-params';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name)
    private companyModel: SoftDeleteModel<CompanyDocument>,
  ) {}

  create(createCompanyDto: CreateCompanyDto, user: IUser) {
    return this.companyModel.create({
      ...createCompanyDto,
      createdBy: {
        _id: user._id,
        email: user.email,
      },
    });
  }

  async findAll(current: number, pageSize: number, qs: string) {
    const { filter, sort, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    const offset = (current - 1) * pageSize;

    const totalItems = (await this.companyModel.find(filter)).length;

    const totalPages = Math.ceil(totalItems / pageSize);

    const result = await this.companyModel
      .find(filter)
      .skip(offset)
      .limit(pageSize)
      .sort(sort as any)
      .populate(population)
      .exec();

    return {
      meta: {
        current, // current page
        pageSize, // page size
        pages: totalPages, // number of pages (with filter condition)
        total: totalItems, // number of records
      },
      result, // query result
    };
  }

  findOne(id: string) {
    return `This action returns a #${id} company`;
  }

  update(id: string, updateCompanyDto: UpdateCompanyDto, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id))
      return `Company id ${id} not found`;
    return this.companyModel.updateOne(
      { _id: id },
      {
        ...updateCompanyDto,
        updatedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );
  }

  async remove(id: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id))
      return `Company id ${id} not found`;
    await this.companyModel.updateOne(
      { _id: id },
      {
        deletedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );
    return this.companyModel.softDelete({ _id: id });
  }
}
