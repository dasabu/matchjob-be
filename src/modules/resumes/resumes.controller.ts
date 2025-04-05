import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { UploadResumeDto } from './dto/upload-resume.dto';
import { User } from 'src/shared/decorators/user.decorator';
import { IUser } from '../users/user.interface';

@Controller('resumes')
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Post()
  create(@Body() uploadResumeDto: UploadResumeDto, @User() user: IUser) {
    return this.resumesService.create(uploadResumeDto, user);
  }

  @Get()
  findAll(
    @Query('current') current: string,
    @Query('pageSize') pageSize: string,
    @Query() qs: string,
  ) {
    return this.resumesService.findAll(
      current ? +current : 1,
      pageSize ? +pageSize : 10,
      qs,
    );
  }

  @Get('me')
  findResumesByUser(@User() user: IUser) {
    return this.resumesService.findResumesByUser(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resumesService.findOneById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body('status') status: string,
    @User() user: IUser,
  ) {
    return this.resumesService.update(id, status, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.resumesService.remove(id, user);
  }
}
