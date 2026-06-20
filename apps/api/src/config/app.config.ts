import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const appConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'v1',

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES ?? '7d',
  },

  encryption: {
    masterKey: process.env.MASTER_ENCRYPTION_KEY, // Exactly 32 chars
  },

  minio: {
    endpoint: process.env.MINIO_ENDPOINT ?? 'localhost',
    port: parseInt(process.env.MINIO_PORT ?? '9000', 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    bucket: process.env.MINIO_BUCKET ?? 'facturacion',
  },

  sri: {
    environment: process.env.SRI_ENVIRONMENT ?? 'pruebas',
    wsdlReceptionTest: process.env.SRI_WSDL_RECEIVE_TEST,
    wsdlAuthorizationTest: process.env.SRI_WSDL_AUTHORIZE_TEST,
    wsdlReceptionProd: process.env.SRI_WSDL_RECEIVE_PROD,
    wsdlAuthorizationProd: process.env.SRI_WSDL_AUTHORIZE_PROD,
  },

  mail: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM,
  },
}));

export function validateConfig(config: Record<string, unknown>) {
  const schema = Joi.object({
    NODE_ENV: Joi.string()
      .valid('development', 'production', 'test')
      .default('development'),
    PORT: Joi.number().default(3000),
    API_PREFIX: Joi.string().default('v1'),
    DATABASE_URL: Joi.string().required().messages({
      'any.required': 'DATABASE_URL is required',
    }),
    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().default(6379),
    REDIS_PASSWORD: Joi.string().allow('').optional(),
    JWT_ACCESS_SECRET: Joi.string().min(20).required().messages({
      'string.min': 'JWT_ACCESS_SECRET must be at least 20 characters',
      'any.required': 'JWT_ACCESS_SECRET is required',
    }),
    JWT_REFRESH_SECRET: Joi.string().min(20).required().messages({
      'string.min': 'JWT_REFRESH_SECRET must be at least 20 characters',
      'any.required': 'JWT_REFRESH_SECRET is required',
    }),
    JWT_ACCESS_EXPIRES: Joi.string().default('15m'),
    JWT_REFRESH_EXPIRES: Joi.string().default('7d'),
    MASTER_ENCRYPTION_KEY: Joi.string().length(32).required().messages({
      'string.length': 'MASTER_ENCRYPTION_KEY must be exactly 32 characters',
      'any.required': 'MASTER_ENCRYPTION_KEY is required',
    }),
    MINIO_ACCESS_KEY: Joi.string().required(),
    MINIO_SECRET_KEY: Joi.string().required(),
    SRI_ENVIRONMENT: Joi.string()
      .valid('pruebas', 'produccion')
      .default('pruebas'),
    SRI_WSDL_RECEIVE_TEST: Joi.string().uri().required(),
    SRI_WSDL_AUTHORIZE_TEST: Joi.string().uri().required(),
    SRI_WSDL_RECEIVE_PROD: Joi.string().uri().required(),
    SRI_WSDL_AUTHORIZE_PROD: Joi.string().uri().required(),
    SMTP_HOST: Joi.string().allow('').optional(),
    SMTP_PORT: Joi.number().default(587),
    SMTP_SECURE: Joi.string().valid('true', 'false').default('false'),
    SMTP_USER: Joi.string().allow('').optional(),
    SMTP_PASSWORD: Joi.string().allow('').optional(),
    SMTP_FROM: Joi.string().allow('').optional(),
  });

  const { error } = schema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (error) {
    const messages = error.details.map((d) => `  ❌ ${d.message}`).join('\n');
    throw new Error(
      `\n⛔ Invalid or missing environment variables:\n${messages}\n`,
    );
  }

  return config;
}
