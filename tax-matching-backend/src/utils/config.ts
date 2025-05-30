import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment variable validation schema
const envSchema = z.object({
  // Server
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_VERSION: z.string().default('v1'),
  
  // Database
  DATABASE_URL: z.string(),
  
  // Redis
  REDIS_URL: z.string().optional(),
  
  // JWT
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  
  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),
  
  // Email
  SENDGRID_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@tax-matching.com'),
  EMAIL_FROM_NAME: z.string().default('Tax Matching Service'),
  
  // AWS
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('ap-northeast-1'),
  AWS_S3_BUCKET: z.string().optional(),
  
  // File Upload
  MAX_FILE_SIZE: z.string().default('10485760'),
  ALLOWED_FILE_TYPES: z.string().default('image/jpeg,image/png,image/gif,application/pdf'),
  
  // CORS
  CORS_ORIGIN: z.string().default('*'),
  CORS_CREDENTIALS: z.string().transform(val => val === 'true').default('true'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX: z.string().default('100'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_DIR: z.string().default('logs'),
  
  // Security
  BCRYPT_ROUNDS: z.string().default('10'),
  SESSION_SECRET: z.string(),
  
  // API Keys
  OPENAI_API_KEY: z.string().optional(),
  INTERNAL_API_KEY: z.string().optional(),
  
  // Frontend URLs
  FRONTEND_URL: z.string().default('http://localhost:3001'),
  PASSWORD_RESET_URL: z.string().default('http://localhost:3001/reset-password'),
  
  // Webhook
  WEBHOOK_SECRET: z.string().optional(),
  
  // Payment (Future)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

// Parse and validate environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsedEnv.data;

export const config = {
  // Server
  port: parseInt(env.PORT),
  nodeEnv: env.NODE_ENV,
  apiVersion: env.API_VERSION,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  
  // Database
  database: {
    url: env.DATABASE_URL,
  },
  
  // Redis
  redis: {
    url: env.REDIS_URL,
  },
  
  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  
  // Google OAuth
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    callbackUrl: env.GOOGLE_CALLBACK_URL,
  },
  
  // Email
  email: {
    sendgridApiKey: env.SENDGRID_API_KEY,
    from: env.EMAIL_FROM,
    fromName: env.EMAIL_FROM_NAME,
  },
  
  // AWS
  aws: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
    s3Bucket: env.AWS_S3_BUCKET,
  },
  
  // File Upload
  upload: {
    maxFileSize: parseInt(env.MAX_FILE_SIZE),
    allowedFileTypes: env.ALLOWED_FILE_TYPES.split(','),
  },
  
  // CORS
  cors: {
    origin: env.CORS_ORIGIN.split(',').map(origin => origin.trim()),
    credentials: env.CORS_CREDENTIALS,
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS),
    max: parseInt(env.RATE_LIMIT_MAX),
  },
  
  // Logging
  logging: {
    level: env.LOG_LEVEL,
    dir: env.LOG_DIR,
  },
  
  // Security
  security: {
    bcryptRounds: parseInt(env.BCRYPT_ROUNDS),
    sessionSecret: env.SESSION_SECRET,
  },
  
  // API Keys
  apiKeys: {
    openai: env.OPENAI_API_KEY,
    internal: env.INTERNAL_API_KEY,
  },
  
  // URLs
  urls: {
    frontend: env.FRONTEND_URL,
    passwordReset: env.PASSWORD_RESET_URL,
  },
  
  // Webhook
  webhook: {
    secret: env.WEBHOOK_SECRET,
  },
  
  // Payment
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },
};