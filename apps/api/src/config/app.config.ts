import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const isProduction = nodeEnv === 'production';

  return {
    nodeEnv,
    isProduction,
    port: parseInt(process.env.PORT ?? '3001', 10),
    apiPrefix: process.env.API_PREFIX ?? 'api/v1',
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    trustProxy: process.env.TRUST_PROXY === 'true' || isProduction,
    swaggerEnabled:
      process.env.SWAGGER_ENABLED === 'true' ||
      (!isProduction && process.env.SWAGGER_ENABLED !== 'false'),
    metricsEnabled: process.env.METRICS_ENABLED === 'true',
  };
});
