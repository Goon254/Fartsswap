import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

export class OpenChallengeBodyDto {
  @ApiPropertyOptional({ description: 'Optional structured context (e.g. perspective, hasValidParams)' })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
