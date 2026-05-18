import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class CertificatePreviewBodyDto {
  @ApiProperty({ enum: ['official_pdf', 'wall_print'] })
  @IsIn(['official_pdf', 'wall_print'])
  certificateKind!: 'official_pdf' | 'wall_print';
}
