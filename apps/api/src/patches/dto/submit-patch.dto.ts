import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitPatchDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(90000)
  patch: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  explanation?: string;
}
