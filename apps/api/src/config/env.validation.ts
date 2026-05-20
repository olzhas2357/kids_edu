import { plainToInstance, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum NodeEnvironment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(NodeEnvironment)
  NODE_ENV!: NodeEnvironment;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  PORT!: number;

  @IsString()
  API_PREFIX!: string;

  @IsString()
  CORS_ORIGIN!: string;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET!: string;

  @IsOptional()
  @IsString()
  REDIS_URL?: string;

  @IsOptional()
  @IsString()
  OPENAI_API_KEY?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
    whitelist: true,
  });

  if (errors.length > 0) {
    const message = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .filter(Boolean)
      .join('; ');
    throw new Error(`Environment validation failed: ${message}`);
  }

  if (validated.NODE_ENV === NodeEnvironment.Production) {
    if (validated.JWT_ACCESS_SECRET.includes('change-me')) {
      throw new Error('Environment validation failed: JWT_ACCESS_SECRET must be changed in production');
    }
    const aiEnabled = process.env.AI_ENABLED !== 'false';
    if (aiEnabled && !process.env.OPENAI_API_KEY?.trim()) {
      throw new Error('Environment validation failed: OPENAI_API_KEY is required when AI_ENABLED=true');
    }
  }

  return validated;
}
