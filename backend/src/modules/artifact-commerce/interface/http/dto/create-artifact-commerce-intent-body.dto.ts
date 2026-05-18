import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateArtifactCommerceIntentBodyDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  reportId!: string;

  @ApiPropertyOptional({ description: 'Analytics surface (report, wrapped, creator, …)' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  sourceSurface?: string;

  @ApiPropertyOptional({ description: 'Correlates with client dossier variant id when known' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  variantId?: string;
}
