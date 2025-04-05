import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { Resume, ResumeDocument } from './schemas/resume.schema';
import mongoose from 'mongoose';
import { IUser } from '../users/user.interface';
import { UploadResumeDto } from './dto/upload-resume.dto';
import aqp from 'api-query-params';

@Injectable()
export class ResumesService {
  constructor(
    @InjectModel(Resume.name)
    private resumeModel: SoftDeleteModel<ResumeDocument>,
  ) {}

  async create(uploadResumeDto: UploadResumeDto, user: IUser) {
    const { url, company, job } = uploadResumeDto;
    const { _id, email } = user;
    const status = 'PENDING';

    const newResume = await this.resumeModel.create({
      url,
      company,
      job,
      userId: _id,
      email,
      status,
      createdBy: { _id, email },
      history: [
        {
          status,
          updatedAt: new Date(),
          updatedBy: { _id, email },
        },
      ],
    });

    return {
      _id: newResume._id,
      createdAt: newResume.createdAt,
    };
  }

  async findAll(current: number, pageSize: number, qs: string) {
    // &populate=company,job&fields=company._id,company.name,company.logo,job._id,job.name
    const { filter, sort, population, projection } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    const offset = (current - 1) * pageSize;

    const totalItems = (await this.resumeModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / pageSize);

    const result = await this.resumeModel
      .find(filter)
      .skip(offset)
      .limit(pageSize)
      .sort(sort as any)
      .populate(population)
      .select(projection as any)
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

  async findResumesByUser(user: IUser) {
    return await this.resumeModel
      .find({
        userId: user._id,
      })
      .sort('-createdAt')
      .populate([
        {
          path: 'company',
          select: { name: 1 },
        },
        {
          path: 'job',
          select: { name: 1 },
        },
      ]);
  }

  async findOneById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new BadRequestException(`Resume id ${id} not found`);
    return await this.resumeModel.findById(id);
  }

  async update(id: string, status: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new BadRequestException(`Resume id ${id} not found`);
    return await this.resumeModel.updateOne(
      { _id: id },
      {
        status,
        updatedBy: {
          _id: user._id,
          email: user.email,
        },
        // push new element into old array (history)
        $push: {
          history: {
            status,
            updatedAt: new Date(),
            updatedBy: {
              _id: user._id,
              email: user.email,
            },
          },
        },
      },
    );
  }

  async remove(id: string, user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new BadRequestException(`Resume id ${id} not found`);

    await this.resumeModel.updateOne(
      { _id: id },
      {
        deletedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );
    return this.resumeModel.softDelete({
      _id: id,
    });
  }
}
