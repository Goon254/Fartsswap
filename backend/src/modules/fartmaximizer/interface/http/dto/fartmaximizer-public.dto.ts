import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import type {
  FartmaxMealRow,
  FartmaximizerLeaderboardResult,
} from '../../../application/fartmaximizer-application.service';

export class SubmitFartmaxMealDto {
  @ApiProperty({ example: 'Wedding Buffet + Open Bar + Speech' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'Filed during the best man toast.' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  description?: string;
}

export class CastFartmaxVoteDto {
  @ApiProperty({ enum: ['up', 'down'] })
  @IsIn(['up', 'down'])
  direction!: 'up' | 'down';
}

export class FartmaxMealDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ description: 'Net vote score (upvotes − downvotes)' })
  votes!: number;

  @ApiProperty()
  upvoteCount!: number;

  @ApiProperty()
  downvoteCount!: number;

  @ApiProperty()
  createdAt!: string;

  static fromRow(row: FartmaxMealRow): FartmaxMealDto {
    const dto = new FartmaxMealDto();
    dto.id = row.id;
    dto.name = row.name;
    dto.description = row.description;
    dto.votes = row.votes;
    dto.upvoteCount = row.upvoteCount;
    dto.downvoteCount = row.downvoteCount;
    dto.createdAt = row.createdAt;
    return dto;
  }
}

export class FartmaximizerLeaderboardDto {
  @ApiProperty()
  enabled!: boolean;

  @ApiProperty({ type: [FartmaxMealDto] })
  meals!: FartmaxMealDto[];

  @ApiProperty({
    description: 'Current session votes keyed by meal id',
    example: { 'f1000001-0001-4001-8001-000000000001': 'up' },
  })
  myVotes!: Record<string, 'up' | 'down'>;

  static fromResult(result: FartmaximizerLeaderboardResult): FartmaximizerLeaderboardDto {
    const dto = new FartmaximizerLeaderboardDto();
    dto.enabled = result.enabled;
    dto.meals = result.meals.map((m) => FartmaxMealDto.fromRow(m));
    dto.myVotes = result.myVotes;
    return dto;
  }
}

export class FartmaximizerLeaderboardQueryDto {
  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
