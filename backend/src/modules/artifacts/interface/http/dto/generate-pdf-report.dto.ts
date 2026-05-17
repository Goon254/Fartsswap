import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class GeneratePdfReportDto {
  @ApiPropertyOptional({
    example: 'clinical_gold',
    description:
      'PDF theme code. Unknown codes are coerced to `default`. See backend/README.md for the registry.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  themeCode?: string;
}
