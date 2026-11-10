import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectPatchDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  note: string;
}
