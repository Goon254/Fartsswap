import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateShareCardDto {
  @ApiPropertyOptional({
    example: 'clinical',
    enum: ['default', 'clinical', 'dramatic'],
    description: 'Visual style variant for the share card',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @IsIn(['default', 'clinical', 'dramatic'])
  styleVariant?: string;
}
