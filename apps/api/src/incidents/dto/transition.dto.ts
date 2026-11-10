import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { MANUAL_TARGETS } from '../incident-workflow.js';

export class TransitionDto {
  @IsIn(MANUAL_TARGETS)
  to: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
