import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsUUID } from 'class-validator';

export class ResolveChallengeBodyDto {
  @ApiPropertyOptional({ description: 'Responder dossier created from a live recording' })
  @IsOptional()
  @IsUUID('4')
  responseReportId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
