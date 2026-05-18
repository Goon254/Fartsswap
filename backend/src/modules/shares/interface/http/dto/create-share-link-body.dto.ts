import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateShareLinkBodyDto {
  @ApiPropertyOptional({ description: 'Logical share surface (e.g. share_card, dossier)' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  kind?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
