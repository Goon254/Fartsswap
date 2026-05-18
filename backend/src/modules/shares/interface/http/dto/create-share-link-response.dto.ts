import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ShareLink } from '../../../../../shared/domain/models';

export class CreateShareLinkResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  reportId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  sessionId?: string;

  @ApiProperty()
  token!: string;

  @ApiProperty()
  createdAt!: string;

  static fromDomain(link: ShareLink): CreateShareLinkResponseDto {
    const dto = new CreateShareLinkResponseDto();
    dto.id = link.id;
    dto.reportId = link.reportId;
    dto.sessionId = link.sessionId;
    dto.token = link.token;
    dto.createdAt = link.createdAt;
    return dto;
  }
}
