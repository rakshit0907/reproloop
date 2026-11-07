import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateIncidentDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  expectedBehavior?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  actualBehavior?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  reproductionSteps?: string;
}
