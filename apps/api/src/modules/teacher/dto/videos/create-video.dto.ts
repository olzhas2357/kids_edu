import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUrl, MaxLength, Min, MinLength } from 'class-validator';
import { IsYoutubeUrl } from '../../validators/youtube-url.validator';

export class CreateVideoDto {
  @ApiProperty({ example: 'Adding numbers' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
  @IsYoutubeUrl()
  url!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  @MaxLength(512)
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: 300 })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationSeconds?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}

export class UpdateVideoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsYoutubeUrl()
  url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  @MaxLength(512)
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  durationSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
