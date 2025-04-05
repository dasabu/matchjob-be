import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsObject,
  IsString,
  Min,
  registerDecorator,
  Validate,
  ValidateNested,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import mongoose from 'mongoose';

// @ValidatorConstraint({ name: 'isEndDateAfterStartDate', async: false })
// export class IsEndDateAfterStartDate implements ValidatorConstraintInterface {
//   validate(endDate: Date, args: ValidationArguments) {
//     const obj = args.object as any;
//     return obj.startDate ? endDate >= obj.startDate : false;
//   }

//   defaultMessage(args: ValidationArguments) {
//     return 'endDate must be greater than or equal to startDate';
//   }
// }

/* Custom decorator */
function IsEndDateAfterStartDate(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object, propertyName: string) {
    registerDecorator({
      name: 'isEndDateAfterStartDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: {
        validate(value: any, args: ValidationArguments) {
          const relatedPropertyName = args.constraints[0];
          const relatedValue = (args.object as any)[relatedPropertyName];
          return relatedValue ? value >= relatedValue : false;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be greater than or equal to ${args.constraints[0]}`;
        },
      },
    });
  };
}

class JobCompany {
  @IsNotEmpty()
  @IsMongoId()
  _id: mongoose.Schema.Types.ObjectId;

  @IsNotEmpty()
  name: string;
}

export class CreateJobDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true }) // 'each' tells class-validator to run the validation on each item of the array
  skills: string;

  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => JobCompany)
  company: JobCompany;

  @IsNotEmpty()
  @IsNumber()
  salary: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNotEmpty()
  @IsString()
  level: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsDate()
  @Transform(({ value }) => new Date(value)) // string to Date
  //   @MinDate(new Date())
  //   @MaxDate(new Date())
  startDate: Date;

  @IsNotEmpty()
  @IsDate()
  @Transform(({ value }) => new Date(value))
  //   @Validate(IsEndDateAfterStartDate)
  @IsEndDateAfterStartDate('startDate')
  endDate: Date;
}
