import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import mongoose from 'mongoose';

export class UploadResumeDto {
  @IsNotEmpty()
  @IsString()
  url: string;

  @IsNotEmpty()
  @IsMongoId()
  company: mongoose.Schema.Types.ObjectId; // company id

  @IsNotEmpty()
  @IsMongoId()
  job: mongoose.Schema.Types.ObjectId; // job id
}
