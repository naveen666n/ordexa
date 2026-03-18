const Joi = require('joi');

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5000),

  // Database
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(3306),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').default(''),
  DB_NAME: Joi.string().required(),

  // Redis
  REDIS_URL: Joi.string().default('redis://localhost:6379'),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRY: Joi.string().default('7d'),

  // Encryption
  ENCRYPTION_KEY: Joi.string().length(64).required(),

  // Google OAuth
  GOOGLE_CLIENT_ID: Joi.string().allow('').default(''),
  GOOGLE_CLIENT_SECRET: Joi.string().allow('').default(''),
  GOOGLE_CALLBACK_URL: Joi.string().default('http://localhost:5000/api/v1/auth/google/callback'),

  // Payment gateway selector — 'mock' | 'razorpay'
  // Use 'mock' for local dev / test / UAT; switch to 'razorpay' when real credentials are ready
  PAYMENT_GATEWAY: Joi.string().valid('mock', 'razorpay').default('mock'),

  // Razorpay (only required when PAYMENT_GATEWAY=razorpay)
  RAZORPAY_KEY_ID: Joi.string().allow('').default(''),
  RAZORPAY_KEY_SECRET: Joi.string().allow('').default(''),
  RAZORPAY_WEBHOOK_SECRET: Joi.string().allow('').default(''),

  // App
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),
  ALLOWED_ORIGINS: Joi.string().default('http://localhost:3000'),
  UPLOAD_DIR: Joi.string().default('uploads'),
  MAX_FILE_SIZE: Joi.number().default(10485760), // 10MB
}).unknown(true);

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

module.exports = envVars;
